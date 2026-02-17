"""
Repost request/response schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.post import PostInFeedResponse

class CreateRepostRequest(BaseModel):
    """Request body for creating a repost."""

    type: str = Field(..., description="'normal' or 'quote'")
    quote_content: Optional[str] = Field(None, max_length=10000)
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None

class OriginalPostAuthor(BaseModel):
    """Author of the original post (for quote repost response)."""

    username: str
    display_name: str

class OriginalPostSummary(BaseModel):
    """Original post summary in repost response."""

    id: str
    author: OriginalPostAuthor
    content: str

class RepostResponse(BaseModel):
    """Response after creating a repost."""

    id: str
    type: str
    original_post: OriginalPostSummary
    quote_content: Optional[str] = None
    created_at: datetime
    quote_post: Optional[PostInFeedResponse] = None
