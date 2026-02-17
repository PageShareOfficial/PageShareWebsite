"""
Post request/response schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.poll import PollCreate, PollInfo

class CreatePostRequest(BaseModel):
    """Request body for creating a post. Content can be empty when media_urls or gif_url is provided. Optional poll: 2-4 options, duration 1-7 days."""

    content: str = Field(default="", max_length=10000)
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    poll: Optional[PollCreate] = None

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Great analysis on $AAPL! 🚀",
                "media_urls": None,
                "gif_url": None,
            }
        }

class PostAuthor(BaseModel):
    """Author summary for post responses."""

    id: str
    username: str
    display_name: str
    profile_picture_url: Optional[str] = None
    badge: Optional[str] = None

class PostStats(BaseModel):
    """Aggregated stats for a post."""

    likes: int = 0
    comments: int = 0
    reposts: int = 0

class UserInteractions(BaseModel):
    """Current user's interactions with a post (when authenticated)."""

    liked: bool = False
    reposted: bool = False

class TickerInfo(BaseModel):
    """Ticker summary for post responses."""

    symbol: str
    name: Optional[str] = None

class PostResponse(BaseModel):
    """Single post response (create or get by id)."""

    id: str
    user_id: str
    content: str
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    stats: PostStats = Field(default_factory=PostStats)
    user_interactions: UserInteractions = Field(default_factory=UserInteractions)
    tickers: List[TickerInfo] = Field(default_factory=list)
    created_at: datetime
    poll: Optional[PollInfo] = None

    class Config:
        from_attributes = True

class OriginalPostInResponse(BaseModel):
    """Embedded original post for quote reposts (so the client can render the quoted tweet)."""

    id: str
    author: PostAuthor
    content: str
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    created_at: datetime

class PostInFeedResponse(BaseModel):
    """Post in list/feed (includes author)."""

    id: str
    author: PostAuthor
    content: str
    media_urls: Optional[List[str]] = None
    gif_url: Optional[str] = None
    stats: PostStats = Field(default_factory=PostStats)
    user_interactions: UserInteractions = Field(default_factory=UserInteractions)
    tickers: List[TickerInfo] = Field(default_factory=list)
    created_at: datetime
    poll: Optional[PollInfo] = None
    original_post_id: Optional[str] = None
    repost_type: Optional[str] = None
    reposted_by_profile_user: Optional[bool] = None
    original_post: Optional[OriginalPostInResponse] = None
