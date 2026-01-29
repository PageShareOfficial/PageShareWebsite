"""
Create reports (post, comment, or user). Exactly one target per report.
"""
from __future__ import annotations
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.post import Post
from app.models.report import Report
from app.models.user import User

def create_report(
    db: Session,
    reporter_id: UUID,
    *,
    reported_post_id: Optional[UUID] = None,
    reported_comment_id: Optional[UUID] = None,
    reported_user_id: Optional[UUID] = None,
    report_type: str,
    reason: Optional[str] = None,
) -> Report:
    """
    Create a report. Exactly one of reported_post_id, reported_comment_id, reported_user_id must be set.
    Validates target exists. Raises ValueError if invalid.
    """
    count = sum(1 for x in (reported_post_id, reported_comment_id, reported_user_id) if x is not None)
    if count != 1:
        raise ValueError("Exactly one of reported_post_id, reported_comment_id, reported_user_id must be set")
    if not (report_type and report_type.strip()):
        raise ValueError("report_type is required")

    if reported_post_id is not None:
        post = db.query(Post).filter(Post.id == reported_post_id, Post.deleted_at.is_(None)).first()
        if not post:
            raise ValueError("Post not found")
    elif reported_comment_id is not None:
        comment = (
            db.query(Comment)
            .filter(Comment.id == reported_comment_id, Comment.deleted_at.is_(None))
            .first()
        )
        if not comment:
            raise ValueError("Comment not found")
    else:
        user = db.get(User, reported_user_id)
        if not user:
            raise ValueError("User not found")

    report = Report(
        reporter_id=reporter_id,
        reported_post_id=reported_post_id,
        reported_comment_id=reported_comment_id,
        reported_user_id=reported_user_id,
        report_type=report_type.strip(),
        reason=reason.strip() if reason else None,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
