"""
Search response schemas (users and tickers only).
"""
from typing import List, Optional
from pydantic import BaseModel

class SearchUserItem(BaseModel):
    """One user in search results."""

    id: str
    username: str
    display_name: str
    profile_picture_url: Optional[str] = None

class SearchTickerItem(BaseModel):
    """One ticker in search results."""

    symbol: str
    name: Optional[str] = None

class SearchResponseData(BaseModel):
    """Search result data: users and tickers only."""

    users: List[SearchUserItem] = []
    tickers: List[SearchTickerItem] = []
