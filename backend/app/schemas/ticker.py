"""
Ticker response schemas (trending).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TrendingTickerResponse(BaseModel):
    """One trending ticker from GET /tickers/trending."""

    ticker_id: str
    symbol: str
    name: Optional[str] = None
    mention_count: int = 0
    mentions_24h: int = 0
    last_mentioned_at: Optional[datetime] = None
