"""Admin moderation request/response schemas."""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

ReportStatus = Literal["pending", "reviewed", "resolved", "dismissed"]
ReportContentType = Literal["post", "comment", "user"]

class AdminReportItem(BaseModel):
    """One report in the admin moderation queue, with its target resolved."""

    id: str
    status: ReportStatus
    report_type: str
    reason: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reporter_username: Optional[str] = None
    content_type: ReportContentType
    content_id: Optional[str] = None
    post_id: Optional[str] = None
    content_preview: Optional[str] = None
    content_deleted: bool = False
    target_username: Optional[str] = None

class UpdateReportStatusRequest(BaseModel):
    """Body for PATCH /admin/reports/{id}. Pending is not a valid target state."""

    status: Literal["reviewed", "resolved", "dismissed"]
