"""
Report endpoints: create report and list current user's reports.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.comment import Comment
from app.models.post import Post
from app.models.report import Report
from app.models.user import User
from app.schemas.report import CreateReportRequest, ListReportsResponse, ReportItem, ReportResponse
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

@router.get("", response_model=dict)
def list_my_reports_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    List reports created by the current user.

    Returns normalized items with:
    - content_type: 'post' | 'comment' | 'user'
    - content_id: id of the reported post/comment/user
    - post_id: for comments, the parent post id (string); for posts, same as content_id; for users, None
    - reported_user_handle: username of the account the content belongs to
    - reason: short code from report_type (e.g. 'spam', 'harassment', ...)
    - description: free-text reason (optional)
    """
    reporter_id = UUID(current_user.auth_user_id)
    reports = (
        db.query(Report)
        .filter(Report.reporter_id == reporter_id)
        .order_by(Report.created_at.desc())
        .all()
    )

    items: list[ReportItem] = []

    for r in reports:
        content_type: str
        content_id: str
        post_id_str: str | None = None
        reported_user_handle: str = "unknown"

        if r.reported_post_id is not None:
            content_type = "post"
            content_id = str(r.reported_post_id)
            post = db.get(Post, r.reported_post_id)
            if post is not None:
                post_id_str = str(post.id)
                user = db.get(User, post.user_id)
                if user is not None:
                    reported_user_handle = user.username
        elif r.reported_comment_id is not None:
            content_type = "comment"
            content_id = str(r.reported_comment_id)
            comment = db.get(Comment, r.reported_comment_id)
            if comment is not None:
                post_id_str = str(comment.post_id)
                user = db.get(User, comment.user_id)
                if user is not None:
                    reported_user_handle = user.username
        else:
            content_type = "user"
            if r.reported_user_id is not None:
                content_id = str(r.reported_user_id)
                user = db.get(User, r.reported_user_id)
                if user is not None:
                    reported_user_handle = user.username
            else:
                # Shouldn't happen due to constraints, but guard anyway
                content_id = ""

        items.append(
            ReportItem(
                id=str(r.id),
                content_type=content_type,
                content_id=content_id,
                post_id=post_id_str,
                reported_user_handle=reported_user_handle,
                reason=r.report_type,
                description=r.reason,
                created_at=r.created_at,
            )
        )

    return {"data": ListReportsResponse(reports=items)}
