from typing import List
from pydantic import BaseModel

class MediaUploadResponse(BaseModel):
    """Single uploaded file result (for posts or comments)."""

    url: str
    filename: str
    content_type: str
    size_bytes: int

class MediaUploadListResponse(BaseModel):
    """Response after uploading one or more media files for a post or comment."""

    uploads: List[MediaUploadResponse]
