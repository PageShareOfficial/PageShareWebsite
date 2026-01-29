"""
Report request/response schemas.
"""
from datetime import datetime
from typing import Optional
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
