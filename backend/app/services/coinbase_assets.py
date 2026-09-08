"""Base asset helpers for Coinbase price / candle lookups."""

from __future__ import annotations

import re

# Letters and numbers only. Open set — no fixed allowlist.
_BASE_ASSET_PATTERN = re.compile(r"^[A-Z0-9]{1,32}$")


def normalize_base_asset(asset: str | None) -> str:
    """Return stripped uppercase base symbol, or empty if blank."""
    if asset is None:
        return ""
    return asset.strip().upper()


def require_base_asset(asset: str | None) -> str:
    """Normalize and require a non-empty base symbol shape."""
    normalized = normalize_base_asset(asset)
    if not normalized:
        raise ValueError("Asset is required")
    if not _BASE_ASSET_PATTERN.fullmatch(normalized):
        raise ValueError(f"Invalid asset symbol: {normalized}")
    return normalized

def coinbase_product_id(asset: str | None) -> str:
    """Map base symbol to Coinbase product id (e.g. BTC → BTC-USD)."""
    return f"{require_base_asset(asset)}-USD"
