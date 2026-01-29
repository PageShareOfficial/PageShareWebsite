"""
Follow request/response schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class FollowToggleResponse(BaseModel):
    """Response after follow or unfollow."""

    following: bool
    follower_count: int

class FollowerFollowingItem(BaseModel):
    """One user in followers or following list."""

    id: str
    username: str
    display_name: str
    profile_picture_url: Optional[str] = None
    is_following: bool = False
    followed_at: datetime
