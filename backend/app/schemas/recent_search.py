"""
Recent search request/response schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RecentSearchCreate(BaseModel):
    """Body for POST /users/me/recent-searches."""

    type: str = Field(..., description="account or ticker")
    result_id: str = Field(..., description="username or ticker symbol")
    query: str = Field(..., min_length=1)
    result_display_name: Optional[str] = None
    result_image_url: Optional[str] = None


class RecentSearchItem(BaseModel):
    """One recent search in list response."""

    id: str
    type: str
    result_id: str
    query: str
    result_display_name: Optional[str] = None
    result_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
