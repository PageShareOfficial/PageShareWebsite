"""
Error log request/response schemas for POST /errors/log, GET /errors, PATCH /errors/{id}/resolve.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

VALID_SEVERITIES = {"debug", "info", "warning", "error", "critical"}
VALID_ERROR_TYPES = {"backend", "frontend", "api", "database"}

class LogErrorRequest(BaseModel):
    """Request body for POST /errors/log (frontend/client errors)."""

    error_type: str = Field(..., description="backend, frontend, api, database")
    error_code: Optional[str] = None
    error_message: str = Field(..., min_length=1)
    stack_trace: Optional[str] = None
    user_id: Optional[str] = None
    page_url: Optional[str] = None
    user_agent: Optional[str] = None
    severity: str = Field(default="error", description="debug, info, warning, error, critical")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error_type": "frontend",
                "error_code": "COMPONENT_ERROR",
                "error_message": "Failed to render component",
                "severity": "error",
                "page_url": "/home",
            }
        }

class ErrorLogResponse(BaseModel):
    """Single error log entry (for list and resolve responses)."""

    id: str
    error_type: str
    error_code: Optional[str] = None
    error_message: str
    severity: str
    user_id: Optional[str] = None
    request_path: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: datetime

class LogErrorResponse(BaseModel):
    """Response for POST /errors/log."""

    error_id: str
    logged_at: datetime

class ErrorLogListResponse(BaseModel):
    """Paginated list of error logs."""

    data: List[ErrorLogResponse]
    pagination: Dict[str, Any]

class ResolveErrorResponse(BaseModel):
    """Response for PATCH /errors/{error_id}/resolve."""

    id: str
    resolved: bool
    resolved_at: Optional[datetime] = None
