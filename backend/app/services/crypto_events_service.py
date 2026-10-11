"""Crypto events listed on Coinpedia: fetch, parse and cache in memory (no DB table).

Coinpedia renders event cards server-side, so the list is parsed from HTML. The
cache keeps Coinpedia traffic to a few requests per TTL window regardless of how
many users open the events page, and serves the last good list if a refresh fails.
"""

from __future__ import annotations
import logging
import re
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup, Tag

logger = logging.getLogger("pageshare.crypto_events")

COINPEDIA_EVENTS_URL = "https://events.coinpedia.org/"
EVENTS_CACHE_TTL = timedelta(hours=6)
FAILED_REFRESH_RETRY_AFTER = timedelta(minutes=10)
REQUEST_TIMEOUT_SECONDS = 20.0
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

EVENT_STATUSES = ("ongoing", "upcoming", "ended")
TICKET_TYPES = {"Free": "free", "Paid": "paid", "Stay Tuned": "stay_tuned"}
_DATE_PATTERN = re.compile(r"[A-Z][a-z]{2} \d{2}, \d{4}")
_UTC_OFFSET_PATTERN = re.compile(r"UTC:\s*([+\-]?\d{2}:\d{2})")


@dataclass(frozen=True)
class CryptoEvent:
    id: str
    name: str
    url: str
    image_url: Optional[str]
    location: Optional[str]
    start_date: Optional[str]
    utc_offset: Optional[str]
    status: Optional[str]
    ticket_type: Optional[str]
    event_type: Optional[str]


@dataclass(frozen=True)
class EventsSnapshot:
    events: tuple[CryptoEvent, ...]
    fetched_at: Optional[datetime]
    is_stale: bool = False


# --- Parsing (pure) -------------------------------------------------------

def parse_events_html(html: str) -> list[CryptoEvent]:
    """Parse every Coinpedia event card in ``html``; cards without a name or link are skipped."""
    soup = BeautifulSoup(html, "html.parser")
    events = (_parse_event_card(card) for card in soup.select("div.event_card"))
    return [event for event in events if event is not None]

def _parse_event_card(card: Tag) -> Optional[CryptoEvent]:
    name = _text(card.select_one("h4"))
    url = _safe_https_url(_attr(card.select_one("a[href]"), "href"))
    if not name or not url:
        return None
    date_text = _text(card.select_one("h5"))
    ticket_type, event_type = _ticket_and_event_type(card)
    return CryptoEvent(
        id=_event_id(url),
        name=name,
        url=url,
        image_url=_safe_https_url(_attr(card.select_one("img.object-cover"), "src")),
        location=_normalize_location(_text(card.select_one("div.line-clamp-2"))),
        start_date=_parse_start_date(date_text),
        utc_offset=_match_group(_UTC_OFFSET_PATTERN, date_text),
        status=_parse_status(card),
        ticket_type=ticket_type,
        event_type=event_type,
    )

def _parse_start_date(date_text: Optional[str]) -> Optional[str]:
    """Return the ISO date (YYYY-MM-DD) from text like 'Oct 03, 2026 | (UTC: +01:00)'."""
    match = _DATE_PATTERN.search(date_text or "")
    if not match:
        return None
    try:
        return datetime.strptime(match.group(0), "%b %d, %Y").date().isoformat()
    except ValueError:
        return None

def _parse_status(card: Tag) -> Optional[str]:
    for status in EVENT_STATUSES:
        if card.select_one(f"span.label_{status}"):
            return status
    return None

def _normalize_location(location: Optional[str]) -> Optional[str]:
    """Coinpedia writes 'Wien ,Austria'; return 'Wien, Austria'."""
    if not location:
        return None
    parts = [part.strip() for part in location.split(",") if part.strip()]
    return ", ".join(parts) or None

def _ticket_and_event_type(card: Tag) -> tuple[Optional[str], Optional[str]]:
    ticket_type: Optional[str] = None
    event_type: Optional[str] = None
    for item in card.select("ul li"):
        text = item.get_text(strip=True)
        if text in TICKET_TYPES:
            ticket_type = TICKET_TYPES[text]
        elif text and event_type is None:
            event_type = text
    return ticket_type, event_type

def _event_id(url: str) -> str:
    return urlparse(url).path.strip("/") or url

def _safe_https_url(value: Optional[str]) -> Optional[str]:
    """Only pass through absolute https URLs, so the frontend never renders other schemes."""
    if not value:
        return None
    parsed = urlparse(value.strip())
    if parsed.scheme != "https" or not parsed.netloc:
        return None
    return value.strip()

def _text(node: Optional[Tag]) -> Optional[str]:
    if node is None:
        return None
    text = " ".join(node.get_text(" ", strip=True).split())
    return text or None

def _attr(node: Optional[Tag], name: str) -> Optional[str]:
    value = node.get(name) if node is not None else None
    return value if isinstance(value, str) else None

def _match_group(pattern: re.Pattern[str], text: Optional[str]) -> Optional[str]:
    match = pattern.search(text or "")
    return match.group(1) if match else None

# --- Fetching -------------------------------------------------------------

def fetch_coinpedia_events(client: Optional[httpx.Client] = None) -> list[CryptoEvent]:
    """Fetch and parse the listing page (only the first page is server-rendered)."""
    if client is not None:
        return _dedupe(parse_events_html(_get_listing_html(client)))
    with httpx.Client(
        timeout=REQUEST_TIMEOUT_SECONDS, headers=REQUEST_HEADERS, follow_redirects=True
    ) as http:
        return _dedupe(parse_events_html(_get_listing_html(http)))

def _get_listing_html(client: httpx.Client) -> str:
    response = client.get(COINPEDIA_EVENTS_URL)
    response.raise_for_status()
    return response.text

def _dedupe(events: list[CryptoEvent]) -> list[CryptoEvent]:
    seen: set[str] = set()
    unique: list[CryptoEvent] = []
    for event in events:
        if event.id not in seen:
            seen.add(event.id)
            unique.append(event)
    return unique

# --- Cache ----------------------------------------------------------------

class CryptoEventsCache:
    """Thread-safe in-memory cache; keeps serving the last good list when a refresh fails."""

    def __init__(
        self,
        fetcher: Callable[[], list[CryptoEvent]] = fetch_coinpedia_events,
        *,
        ttl: timedelta = EVENTS_CACHE_TTL,
        retry_after: timedelta = FAILED_REFRESH_RETRY_AFTER,
        clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    ) -> None:
        self._fetcher = fetcher
        self._ttl = ttl
        self._retry_after = retry_after
        self._clock = clock
        self._lock = threading.Lock()
        self._snapshot = EventsSnapshot(events=(), fetched_at=None)
        self._last_failure_at: Optional[datetime] = None

    def get(self) -> EventsSnapshot:
        with self._lock:
            if self._is_fresh():
                return self._snapshot
            if self._in_failure_backoff():
                return self._stale_snapshot()
            return self._refresh()

    def _is_fresh(self) -> bool:
        fetched_at = self._snapshot.fetched_at
        return fetched_at is not None and self._clock() - fetched_at < self._ttl

    def _in_failure_backoff(self) -> bool:
        failed_at = self._last_failure_at
        return failed_at is not None and self._clock() - failed_at < self._retry_after

    def _stale_snapshot(self) -> EventsSnapshot:
        return EventsSnapshot(self._snapshot.events, self._snapshot.fetched_at, is_stale=True)

    def _refresh(self) -> EventsSnapshot:
        try:
            events = self._fetcher()
            if not events:
                raise ValueError("no event cards parsed; Coinpedia markup may have changed")
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Coinpedia events refresh failed, serving cached list: %s", exc)
            self._last_failure_at = self._clock()
            return self._stale_snapshot()
        self._last_failure_at = None
        self._snapshot = EventsSnapshot(events=tuple(events), fetched_at=self._clock())
        return self._snapshot

_default_cache = CryptoEventsCache()

def get_crypto_events() -> EventsSnapshot:
    """Cached Coinpedia events for the API layer."""
    return _default_cache.get()
