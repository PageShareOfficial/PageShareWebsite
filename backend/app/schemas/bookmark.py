"""
Bookmark request/response schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class BookmarkToggleResponse(BaseModel):
    """Response after bookmark or unbookmark."""

    bookmarked: bool

class BookmarkedPostAuthor(BaseModel):
    """Author summary in bookmarked post list."""

    id: str
    username: str
    display_name: str
    profile_picture_url: str | None = None
    subscription_plan_id: Optional[str] = None

class BookmarkedPostItem(BaseModel):
    """One bookmarked post in GET /bookmarks list."""

    id: str
    author: BookmarkedPostAuthor
    content: str
    created_at: datetime
    bookmarked_at: datetime
