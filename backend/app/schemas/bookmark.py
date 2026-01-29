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

    username: str
    display_name: str

class BookmarkedPostItem(BaseModel):
    """One bookmarked post in GET /bookmarks list."""

    id: str
    author: BookmarkedPostAuthor
    content: str
    bookmarked_at: datetime
