"""Coinbase market data for prediction entry and settle (base assets only)."""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import quote
import httpx
from app.services.coinbase_assets import coinbase_product_id

COINBASE_EXCHANGE_API_BASE = "https://api.exchange.coinbase.com"
DEFAULT_TIMEOUT_SECONDS = 10.0
# Coinbase rejects candle windows that would return more than 300 buckets.
MAX_CANDLES_PER_REQUEST = 300
MAX_RETRIES = 2
RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})

# Coinbase Exchange granularities (seconds): 60, 300, 900, 3600, 21600, 86400
CandleInterval = Literal["1m", "5m", "15m", "1h", "6h", "1d"]
INTERVAL_TO_GRANULARITY: dict[str, int] = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "6h": 21600,
    "1d": 86400,
}
SUPPORTED_CANDLE_INTERVALS: frozenset[str] = frozenset(INTERVAL_TO_GRANULARITY)

class CoinbaseMarketError(Exception):
    """Base error for Coinbase market lookups."""


class UnsupportedAssetError(CoinbaseMarketError):
    """Asset missing or not a valid base symbol shape."""


class CoinbaseUnavailableError(CoinbaseMarketError):
    """Coinbase request failed or returned unusable data."""


@dataclass(frozen=True)
class Candle:
    open_time: datetime
    open: float
    high: float
    low: float
    close: float

def get_live_price(
    asset: str,
    *,
    client: httpx.Client | None = None,
    base_url: str = COINBASE_EXCHANGE_API_BASE,
) -> float:
    """Fetch the current price for a base asset from Coinbase."""
    product_id = _product_id(asset)
    owns_client = client is None
    http = client or httpx.Client(timeout=DEFAULT_TIMEOUT_SECONDS)
    try:
        path = f"products/{quote(product_id, safe='')}/ticker"
        payload = _get_json(http, f"{_normalize_base(base_url)}/{path}")
        return _parse_ticker_price(payload, asset)
    finally:
        if owns_client:
            http.close()

def get_candles(
    asset: str,
    interval: CandleInterval,
    start_time: datetime,
    end_time: datetime,
    *,
    client: httpx.Client | None = None,
    base_url: str = COINBASE_EXCHANGE_API_BASE,
) -> list[Candle]:
    """Fetch OHLC candles for [start_time, end_time] (max 300 per Coinbase request)."""
    if interval not in SUPPORTED_CANDLE_INTERVALS:
        raise ValueError(f"Unsupported candle interval: {interval}")
    start = _to_utc(start_time)
    end = _to_utc(end_time)
    if end < start:
        raise ValueError("end_time must be >= start_time")

    product_id = _product_id(asset)
    granularity = INTERVAL_TO_GRANULARITY[interval]
    owns_client = client is None
    http = client or httpx.Client(timeout=DEFAULT_TIMEOUT_SECONDS)
    try:
        return _fetch_candles_window(
            http,
            base_url=base_url,
            product_id=product_id,
            granularity=granularity,
            start=start,
            end=end,
        )
    finally:
        if owns_client:
            http.close()

def _product_id(asset: str) -> str:
    try:
        return coinbase_product_id(asset)
    except ValueError as exc:
        raise UnsupportedAssetError(str(exc)) from exc

def _normalize_base(base_url: str) -> str:
    return base_url.rstrip("/")

def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def _parse_ticker_price(payload: object, asset: str) -> float:
    if not isinstance(payload, dict):
        raise CoinbaseUnavailableError(f"Unexpected ticker response for {asset}")
    raw = payload.get("price")
    try:
        price = float(raw)
    except (TypeError, ValueError) as exc:
        raise CoinbaseUnavailableError(f"Invalid price for {asset}") from exc
    if price <= 0:
        raise CoinbaseUnavailableError(f"Invalid price for {asset}")
    return price

def _fetch_candles_window(
    http: httpx.Client,
    *,
    base_url: str,
    product_id: str,
    granularity: int,
    start: datetime,
    end: datetime,
) -> list[Candle]:
    """Page in ≤300-candle chunks; Coinbase rejects oversized windows."""
    chunk_seconds = (MAX_CANDLES_PER_REQUEST - 1) * granularity
    path = f"products/{quote(product_id, safe='')}/candles"
    url = f"{_normalize_base(base_url)}/{path}"
    candles: list[Candle] = []
    cursor = start
    while cursor <= end:
        chunk_end = min(
            end,
            datetime.fromtimestamp(cursor.timestamp() + chunk_seconds, tz=timezone.utc),
        )
        rows = _get_json(
            http,
            url,
            params={
                "granularity": granularity,
                "start": cursor.isoformat().replace("+00:00", "Z"),
                "end": chunk_end.isoformat().replace("+00:00", "Z"),
            },
        )
        batch = _parse_candles(rows)
        candles.extend(batch)
        if chunk_end >= end:
            break
        # Advance past this chunk to avoid overlap/infinite loops.
        cursor = datetime.fromtimestamp(
            chunk_end.timestamp() + granularity, tz=timezone.utc
        )
    return _dedupe_sort_in_window(candles, start=start, end=end)

def _parse_candles(rows: object) -> list[Candle]:
    if not isinstance(rows, list):
        raise CoinbaseUnavailableError("Unexpected candles response")
    return [_parse_candle(row) for row in rows]

def _parse_candle(row: object) -> Candle:
    # Coinbase Exchange: [time, low, high, open, close, volume] — time in seconds.
    if not isinstance(row, (list, tuple)) or len(row) < 5:
        raise CoinbaseUnavailableError("Unexpected candle row")
    try:
        open_seconds = int(row[0])
        low = float(row[1])
        high = float(row[2])
        open_price = float(row[3])
        close = float(row[4])
    except (TypeError, ValueError) as exc:
        raise CoinbaseUnavailableError("Invalid candle values") from exc
    return Candle(
        open_time=datetime.fromtimestamp(open_seconds, tz=timezone.utc),
        open=open_price,
        high=high,
        low=low,
        close=close,
    )

def _dedupe_sort_in_window(
    candles: list[Candle],
    *,
    start: datetime,
    end: datetime,
) -> list[Candle]:
    by_time: dict[datetime, Candle] = {}
    for candle in candles:
        if candle.open_time < start or candle.open_time > end:
            continue
        by_time[candle.open_time] = candle
    return [by_time[key] for key in sorted(by_time)]

def _get_json(
    http: httpx.Client,
    url: str,
    *,
    params: dict | None = None,
) -> object:
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = http.get(url, params=params)
        except httpx.HTTPError as exc:
            last_error = exc
            continue
        if response.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
            continue
        if response.status_code in (400, 404):
            raise CoinbaseUnavailableError(_coinbase_error_message(response))
        if response.status_code != 200:
            raise CoinbaseUnavailableError(
                f"Coinbase HTTP {response.status_code}: {_coinbase_error_message(response)}"
            )
        try:
            return response.json()
        except ValueError as exc:
            raise CoinbaseUnavailableError("Invalid JSON from Coinbase") from exc
    raise CoinbaseUnavailableError(
        f"Coinbase request failed after retries: {last_error}"
    )

def _coinbase_error_message(response: httpx.Response) -> str:
    try:
        data = response.json()
        if isinstance(data, dict):
            for key in ("message", "error", "msg"):
                if data.get(key):
                    return str(data[key])
    except ValueError:
        pass
    text = (response.text or "").strip()
    return text[:200] if text else "unknown error"
