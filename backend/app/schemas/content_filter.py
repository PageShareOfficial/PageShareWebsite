"""
Content filter (mute/block) response schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class MuteResponse(BaseModel):
    """Response after mute."""

    muted: bool = True

class BlockResponse(BaseModel):
    """Response after block."""

    blocked: bool = True

class FilteredUserItem(BaseModel):
    """One user in muted or blocked list."""

    id: str
    username: str
    display_name: str
    profile_picture_url: Optional[str] = None
    muted_at: Optional[datetime] = None
    blocked_at: Optional[datetime] = None

class ContentFiltersResponse(BaseModel):
    """Response for GET /content-filters."""

    muted_users: List[FilteredUserItem] = []
    blocked_users: List[FilteredUserItem] = []
