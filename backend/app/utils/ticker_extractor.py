"""
Extract ticker symbols from text using $TICKER and #TICKER patterns.
Symbols are normalized to uppercase and deduplicated.
"""
from __future__ import annotations
import re
from typing import List

# Match $TICKER or #TICKER. Ticker = letters/numbers, 1-10 chars (e.g. AAPL, BTC, SPY).
# Allow common suffixes like .US for stocks; we strip and take the base symbol.
_PATTERN = re.compile(
    r"(?:\$|#)([A-Za-z0-9.]{1,10})\b",
    re.UNICODE,
)

# Max length for a single symbol after normalization (DB: symbol VARCHAR(20))
_MAX_SYMBOL_LEN = 20

def extract_tickers(text: str | None) -> List[str]:
    """
    Extract ticker symbols from text. Supports $TICKER and #TICKER.
    Returns a list of unique, uppercase symbols (order preserved, first occurrence).
    """
    if not text or not text.strip():
        return []

    seen: set[str] = set()
    result: List[str] = []
    for m in _PATTERN.finditer(text):
        raw = m.group(1).strip().upper()
        # Remove common suffix like .US for display/storage consistency
        if raw.endswith(".US"):
            raw = raw[:-3]
        if not raw or len(raw) > _MAX_SYMBOL_LEN:
            continue
        if raw not in seen:
            seen.add(raw)
            result.append(raw)
    return result
