"""
Admin moderation endpoints. Admin only (user.badge == 'admin').
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_admin
from app.schemas.admin import ReportStatus, UpdateReportStatusRequest
from app.services.admin_report_service import (
    ContentRemovalNotSupportedError,
    build_admin_report_item,
    list_reports,
    remove_reported_content,
    update_report_status,
)
from app.services.auth_service import CurrentUser
from app.utils.http import parse_uuid_or_404
from app.utils.responses import paginated_response

router = APIRouter(prefix="/admin", tags=["admin"])

REPORT_NOT_FOUND = "Report not found"

@router.get("/reports", response_model=dict)
def list_reports_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
    report_status: ReportStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Reports queue (posts, comments, users), newest first, optionally filtered by status."""
    rows, total = list_reports(db, status=report_status, page=page, per_page=per_page)
    data = [build_admin_report_item(db, row) for row in rows]
    return paginated_response(data, page, per_page, total)

@router.patch("/reports/{report_id}", response_model=dict)
def update_report_status_endpoint(
    report_id: str,
    body: UpdateReportStatusRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Mark a report reviewed, resolved, or dismissed."""
    rid = parse_uuid_or_404(report_id, REPORT_NOT_FOUND)
    report = update_report_status(db, rid, body.status, UUID(current_user.auth_user_id))
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=REPORT_NOT_FOUND)
    return {"data": build_admin_report_item(db, report)}

@router.post("/reports/{report_id}/remove-content", response_model=dict)
def remove_reported_content_endpoint(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Delete the reported post or comment and resolve all pending reports on it."""
    rid = parse_uuid_or_404(report_id, REPORT_NOT_FOUND)
    try:
        report = remove_reported_content(db, rid, UUID(current_user.auth_user_id))
    except ContentRemovalNotSupportedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=REPORT_NOT_FOUND)
    return {"data": build_admin_report_item(db, report)}
