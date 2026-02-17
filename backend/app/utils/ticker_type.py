"""
Helpers to classify ticker symbols. Crypto only (CoinGecko); US stocks removed.
"""
from __future__ import annotations
from typing import Literal

TickerKind = Literal["stock", "crypto", "etf", "other"]

KNOWN_CRYPTO_TICKERS = {
    "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "DOT", "MATIC", "AVAX",
    "LTC", "LINK", "UNI", "ATOM", "ETC", "XLM", "ALGO", "VET", "ICP",
}

def normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()

def is_known_crypto(symbol: str) -> bool:
    return normalize_symbol(symbol) in KNOWN_CRYPTO_TICKERS


def detect_ticker_type(symbol: str) -> TickerKind:
    """Classify for Ticker.type. Crypto only; everything else is 'other'."""
    upper = normalize_symbol(symbol)
    if upper in KNOWN_CRYPTO_TICKERS:
        return "crypto"
    return "other"
