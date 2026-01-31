"""
News API response schemas.
"""
from typing import Optional
from pydantic import BaseModel

class NewsArticleResponse(BaseModel):
    """One news article in list response."""

    id: str
    title: str
    description: str
    url: str
    imageUrl: Optional[str] = None
    source: str
    publishedAt: str
    category: str
