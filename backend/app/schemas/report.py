"""
Report request/response schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CreateReportRequest(BaseModel):
    """Request body for POST /reports. Exactly one target required."""

    reported_post_id: Optional[str] = None
    reported_comment_id: Optional[str] = None
    reported_user_id: Optional[str] = None
    report_type: str = Field(..., min_length=1, max_length=50)
    reason: Optional[str] = Field(None, max_length=2000)

class ReportResponse(BaseModel):
    """Response after creating a report."""

    id: str
    status: str
    created_at: datetime

class ReportItem(BaseModel):
    """One report in the current user's report history."""

    id: str
    content_type: str  # 'post' | 'comment' | 'user'
    content_id: str
    post_id: Optional[str] = None
    reported_user_handle: str
    reason: str  # short code like 'spam', 'harassment', etc. (from report_type)
    description: Optional[str] = None
    created_at: datetime

class ListReportsResponse(BaseModel):
    """Response for GET /reports."""

    reports: List[ReportItem] = []
