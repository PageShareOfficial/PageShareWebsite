"""
Comment request/response schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.poll import PollCreate, PollInfo

class CreateCommentRequest(BaseModel):
    """Request body for creating a comment. Optional poll: 2-4 options, duration 1-7 days."""

    content: str = Field(..., min_length=1, max_length=10000)
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    poll: Optional[PollCreate] = None

class CommentAuthor(BaseModel):
    """Author summary for comment responses."""

    id: str
    username: str
    display_name: str
    profile_picture_url: Optional[str] = None

class CommentResponse(BaseModel):
    """Comment in response (create or list)."""

    id: str
    post_id: str
    author: CommentAuthor
    content: str
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    likes: int = 0
    user_liked: bool = False
    created_at: datetime
    poll: Optional[PollInfo] = None
