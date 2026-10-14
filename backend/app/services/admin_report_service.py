"""Admin moderation: review the reports queue and remove reported content."""

import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.post import Post
from app.models.report import Report
from app.models.user import User
from app.schemas.admin import AdminReportItem

logger = logging.getLogger("pageshare.admin_moderation")

CONTENT_PREVIEW_MAX_LENGTH = 280
REPORT_STATUS_PENDING = "pending"
REPORT_STATUS_RESOLVED = "resolved"
REPORT_REVIEW_STATUSES = frozenset({"reviewed", "resolved", "dismissed"})

class ContentRemovalNotSupportedError(Exception):
    """The report targets something that cannot be removed (e.g. a user account)."""

class InvalidReportStatusError(ValueError):
    """Requested review status is not one an admin can set."""

def list_reports(
    db: Session, *, status: Optional[str], page: int, per_page: int
) -> Tuple[List[Report], int]:
    """Reports newest first, optionally filtered by status."""
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    total = query.count()
    rows = (
        query.order_by(Report.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return rows, total

def _preview(content: Optional[str]) -> Optional[str]:
    if content is None or len(content) <= CONTENT_PREVIEW_MAX_LENGTH:
        return content
    return content[:CONTENT_PREVIEW_MAX_LENGTH].rstrip() + "…"

def _username(db: Session, user_id: Optional[UUID]) -> Optional[str]:
    if user_id is None:
        return None
    user = db.get(User, user_id)
    return user.username if user else None

def _post_target_fields(db: Session, post_id: UUID) -> dict:
    post = db.get(Post, post_id)
    if post is None:
        return {"content_id": str(post_id), "content_deleted": True}
    return {
        "content_id": str(post.id),
        "post_id": str(post.id),
        "content_preview": _preview(post.content),
        "content_deleted": post.deleted_at is not None,
        "target_username": _username(db, post.user_id),
    }

def _comment_target_fields(db: Session, comment_id: UUID) -> dict:
    comment = db.get(Comment, comment_id)
    if comment is None:
        return {"content_id": str(comment_id), "content_deleted": True}
    return {
        "content_id": str(comment.id),
        "post_id": str(comment.post_id),
        "content_preview": _preview(comment.content),
        "content_deleted": comment.deleted_at is not None,
        "target_username": _username(db, comment.user_id),
    }

def _target_fields(db: Session, report: Report) -> dict:
    if report.reported_post_id is not None:
        return {"content_type": "post", **_post_target_fields(db, report.reported_post_id)}
    if report.reported_comment_id is not None:
        return {
            "content_type": "comment",
            **_comment_target_fields(db, report.reported_comment_id),
        }
    user_id = report.reported_user_id
    return {
        "content_type": "user",
        "content_id": str(user_id) if user_id else None,
        "target_username": _username(db, user_id),
        "content_deleted": user_id is None,
    }

def build_admin_report_item(db: Session, report: Report) -> AdminReportItem:
    """Report row plus a readable summary of what was reported."""
    return AdminReportItem(
        id=str(report.id),
        status=report.status,
        report_type=report.report_type,
        reason=report.reason,
        created_at=report.created_at,
        reviewed_at=report.reviewed_at,
        reporter_username=_username(db, report.reporter_id),
        **_target_fields(db, report),
    )

def _mark_reviewed(report: Report, status: str, admin_id: UUID) -> None:
    report.status = status
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewed_by = admin_id

def update_report_status(
    db: Session, report_id: UUID, status: str, admin_id: UUID
) -> Optional[Report]:
    """Set a report's review status. Returns None when the report does not exist."""
    if status not in REPORT_REVIEW_STATUSES:
        raise InvalidReportStatusError(f"Unsupported report status: {status!r}")
    report = db.get(Report, report_id)
    if report is None:
        return None
    _mark_reviewed(report, status, admin_id)
    db.commit()
    db.refresh(report)
    logger.info("admin %s set report %s to %s", admin_id, report_id, status)
    return report

def _soft_delete_target(db: Session, report: Report) -> None:
    if report.reported_post_id is not None:
        target = db.get(Post, report.reported_post_id)
    elif report.reported_comment_id is not None:
        target = db.get(Comment, report.reported_comment_id)
    else:
        raise ContentRemovalNotSupportedError("User reports cannot be removed as content.")
    if target is not None and target.deleted_at is None:
        target.deleted_at = datetime.now(timezone.utc)

def _resolve_pending_reports_for_same_target(
    db: Session, report: Report, admin_id: UUID
) -> None:
    query = db.query(Report).filter(Report.status == REPORT_STATUS_PENDING)
    if report.reported_post_id is not None:
        query = query.filter(Report.reported_post_id == report.reported_post_id)
    else:
        query = query.filter(Report.reported_comment_id == report.reported_comment_id)
    for sibling in query.all():
        _mark_reviewed(sibling, REPORT_STATUS_RESOLVED, admin_id)

def remove_reported_content(
    db: Session, report_id: UUID, admin_id: UUID
) -> Optional[Report]:
    """
    Soft-delete the reported post/comment and resolve every pending report on it.
    Returns None when the report does not exist.
    """
    report = db.get(Report, report_id)
    if report is None:
        return None
    _soft_delete_target(db, report)
    _resolve_pending_reports_for_same_target(db, report, admin_id)
    _mark_reviewed(report, REPORT_STATUS_RESOLVED, admin_id)
    db.commit()
    db.refresh(report)
    logger.info("admin %s removed content for report %s", admin_id, report_id)
    return report
