"""Coinbase candle search ladders for prediction evaluation."""

from datetime import timedelta

from app.services.coinbase_market_service import CandleInterval

LADDER_FROM_1D: tuple[CandleInterval, ...] = ("1d", "6h", "1h", "15m", "1m")
LADDER_FROM_6H: tuple[CandleInterval, ...] = ("6h", "1h", "15m", "1m")
LADDER_FROM_1H: tuple[CandleInterval, ...] = ("1h", "15m", "1m")
LADDER_FROM_15M: tuple[CandleInterval, ...] = ("15m", "1m")

# Back-compat alias for older call sites / docs.
SEARCH_LADDER = LADDER_FROM_6H

INTERVAL_DURATION: dict[str, timedelta] = {
    "1m": timedelta(minutes=1),
    "5m": timedelta(minutes=5),
    "15m": timedelta(minutes=15),
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "1d": timedelta(days=1),
}
