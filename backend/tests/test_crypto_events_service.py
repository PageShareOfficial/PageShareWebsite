"""Tests for the Coinpedia crypto events parser, cache and endpoint response."""

from datetime import datetime, timedelta, timezone
import httpx
import pytest
from app.api.events import build_events_response
from app.services.crypto_events_service import (
    CryptoEvent,
    CryptoEventsCache,
    EventsSnapshot,
    parse_events_html,
)

T0 = datetime(2026, 10, 12, 9, 0, tzinfo=timezone.utc)

def _card(
    *,
    name: str = "TABConf 2026",
    href: str = "https://events.coinpedia.org/tabconf-2026-8524/",
    image: str = "https://image.coinpedia.org/app_uploads/events/tabconf.webp",
    status: str = "upcoming",
    location: str = "Atlanta ,United States",
    date: str = "Oct 12, 2026<!-- -->  <!-- --> | (UTC: <!-- -->-05:00<!-- -->)",
    ticket: str = "Paid",
    event_type: str = "Conference",
) -> str:
    """One event card in Coinpedia's real markup (trimmed of unused attributes)."""
    return f"""
    <div class="event_card"><div class="rounded-md">
      <div class="relative mb-2"><a href="{href}">
        <img src="{image}" alt="{name}" class="w-full object-cover rounded-t-md shadow-sm"/></a>
      </div>
      <div class="relative p-4">
        <h6><span class="label_{status} text-xs">{status.title()}</span>
          <span class="label_tags text-xs">Bitcoin <button>+2 ..</button></span></h6>
        <a href="{href}"><h4 class="font-semibold text-base mb-2 line-clamp-2">{name}</h4></a>
        <div class="flex items-start gap-2"><img alt="location" src="https://x/loc.svg"/>
          <div class="text-sm line-clamp-2 min-h-[32px] ">{location}</div></div>
        <h5 class="text-sm text-(--secondary-text-color) font-semibold ">{date}</h5>
        <ul class="flex flex-wrap gap-2 text-sm">
          <li class="flex items-center gap-2 text-sm border-r pr-[10px]">
            <img alt="{ticket}"/>{ticket}</li>
          <li class="flex items-center gap-2 text-sm "><img alt="{event_type}"/>{event_type}</li>
        </ul>
      </div>
    </div></div>
    """

def _page(*cards: str) -> str:
    return f"<html><body><div class='grid'>{''.join(cards)}</div></body></html>"

def _event(event_id: str = "tabconf-2026-8524") -> CryptoEvent:
    return CryptoEvent(
        id=event_id,
        name="TABConf 2026",
        url=f"https://events.coinpedia.org/{event_id}/",
        image_url=None,
        location="Atlanta, United States",
        start_date="2026-10-12",
        utc_offset="-05:00",
        status="upcoming",
        ticket_type="paid",
        event_type="Conference",
    )

# --- Parser ---------------------------------------------------------------

def test_parse_reads_every_field_from_a_card():
    [event] = parse_events_html(_page(_card()))

    assert event == CryptoEvent(
        id="tabconf-2026-8524",
        name="TABConf 2026",
        url="https://events.coinpedia.org/tabconf-2026-8524/",
        image_url="https://image.coinpedia.org/app_uploads/events/tabconf.webp",
        location="Atlanta, United States",
        start_date="2026-10-12",
        utc_offset="-05:00",
        status="upcoming",
        ticket_type="paid",
        event_type="Conference",
    )

@pytest.mark.parametrize(
    ("ticket", "expected"),
    [("Free", "free"), ("Paid", "paid"), ("Stay Tuned", "stay_tuned")],
)
def test_parse_maps_ticket_types(ticket, expected):
    [event] = parse_events_html(_page(_card(ticket=ticket)))
    assert event.ticket_type == expected

def test_parse_reads_ongoing_status():
    [event] = parse_events_html(_page(_card(status="ongoing")))
    assert event.status == "ongoing"

def test_parse_skips_cards_without_a_name_or_https_link():
    html = _page(_card(name=""), _card(href="javascript:alert(1)"), _card())
    assert [event.name for event in parse_events_html(html)] == ["TABConf 2026"]

def test_parse_drops_non_https_image():
    [event] = parse_events_html(_page(_card(image="http://insecure.example/a.png")))
    assert event.image_url is None

def test_parse_tolerates_unreadable_date():
    [event] = parse_events_html(_page(_card(date="Date to be announced")))
    assert event.start_date is None
    assert event.utc_offset is None

def test_parse_returns_empty_list_for_page_without_cards():
    assert parse_events_html("<html><body>Maintenance</body></html>") == []

# --- Cache ----------------------------------------------------------------

class _Clock:
    def __init__(self, now: datetime) -> None:
        self.now = now

    def __call__(self) -> datetime:
        return self.now

def _cache(fetcher, clock: _Clock) -> CryptoEventsCache:
    return CryptoEventsCache(
        fetcher, ttl=timedelta(hours=6), retry_after=timedelta(minutes=10), clock=clock
    )

def test_cache_serves_fresh_list_without_refetching():
    calls = []
    clock = _Clock(T0)
    cache = _cache(lambda: calls.append(1) or [_event()], clock)

    first = cache.get()
    clock.now = T0 + timedelta(hours=5)
    second = cache.get()

    assert len(calls) == 1
    assert second is first
    assert second.fetched_at == T0

def test_cache_refetches_after_ttl():
    calls = []
    clock = _Clock(T0)
    cache = _cache(lambda: calls.append(1) or [_event()], clock)

    cache.get()
    clock.now = T0 + timedelta(hours=6, minutes=1)
    snapshot = cache.get()

    assert len(calls) == 2
    assert snapshot.fetched_at == clock.now

def test_cache_keeps_last_good_list_when_refresh_fails():
    responses = [[_event()], httpx.ConnectError("down")]

    def fetcher():
        result = responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return result

    clock = _Clock(T0)
    cache = _cache(fetcher, clock)
    cache.get()
    clock.now = T0 + timedelta(hours=7)

    snapshot = cache.get()

    assert snapshot.is_stale is True
    assert [event.id for event in snapshot.events] == ["tabconf-2026-8524"]
    assert snapshot.fetched_at == T0

def test_cache_treats_empty_parse_as_failure():
    clock = _Clock(T0)
    cache = _cache(lambda: [], clock)

    snapshot = cache.get()

    assert snapshot.events == ()
    assert snapshot.is_stale is True

def test_cache_waits_before_retrying_a_failed_refresh():
    calls = []

    def failing_fetcher():
        calls.append(1)
        raise httpx.ConnectError("down")

    clock = _Clock(T0)
    cache = _cache(failing_fetcher, clock)

    cache.get()
    clock.now = T0 + timedelta(minutes=5)
    cache.get()
    assert len(calls) == 1

    clock.now = T0 + timedelta(minutes=11)
    cache.get()
    assert len(calls) == 2

# --- Endpoint response ------------------------------------------------------

def test_response_includes_events_source_and_staleness():
    snapshot = EventsSnapshot(events=(_event(),), fetched_at=T0, is_stale=True)

    body = build_events_response(snapshot).model_dump(mode="json")

    assert body["source"] == {"name": "Coinpedia", "url": "https://events.coinpedia.org/"}
    assert body["is_stale"] is True
    assert body["fetched_at"].startswith("2026-10-12T09:00:00")
    assert body["data"][0]["id"] == "tabconf-2026-8524"
    assert body["data"][0]["ticket_type"] == "paid"
