"""
Watchlist request/response schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AddWatchlistRequest(BaseModel):
    """Request body for POST /watchlist."""

    symbol: str = Field(..., min_length=1, max_length=20)

class WatchlistItemResponse(BaseModel):
    """One watchlist item in GET /watchlist list. Price/change/image come from frontend APIs."""

    ticker: str
    name: Optional[str] = None
    type: Optional[str] = None  # 'stock', 'crypto', 'etf', 'other'
    created_at: datetime

class AddWatchlistResponse(BaseModel):
    """Response after adding to watchlist."""

    ticker: str
    added: bool = True
