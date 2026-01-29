"""
Report endpoint: POST /reports (create report).
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.report import CreateReportRequest, ReportResponse
from app.services.auth_service import CurrentUser
from app.services.report_service import create_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_report_endpoint(
    body: CreateReportRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a report (post, comment, or user). Exactly one target required."""
    post_id = UUID(body.reported_post_id) if body.reported_post_id else None
    comment_id = UUID(body.reported_comment_id) if body.reported_comment_id else None
    user_id = UUID(body.reported_user_id) if body.reported_user_id else None
    try:
        report = create_report(
            db,
            UUID(current_user.auth_user_id),
            reported_post_id=post_id,
            reported_comment_id=comment_id,
            reported_user_id=user_id,
            report_type=body.report_type,
            reason=body.reason,
        )
        return {
            "data": ReportResponse(
                id=str(report.id),
                status=report.status,
                created_at=report.created_at,
            )
        }
    except ValueError as e:
        if "Exactly one" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Exactly one of reported_post_id, reported_comment_id, reported_user_id must be set",
            )
        if "report_type" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="report_type is required",
            )
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
