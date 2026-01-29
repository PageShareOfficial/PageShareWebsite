"""
Comment CRUD and reaction count.
"""
from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.reaction import Reaction
from app.models.user import User

def create_comment(
    db: Session,
    post_id: UUID,
    user_id: UUID,
    content: str,
    media_urls: Optional[List[str]] = None,
    gif_url: Optional[str] = None,
) -> Comment:
    """Create a comment on a post."""
    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content.strip(),
        media_urls=media_urls,
        gif_url=gif_url,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

def get_comment_by_id(db: Session, comment_id: UUID) -> Optional[Comment]:
    """Get a single comment by id; exclude soft-deleted."""
    return (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.deleted_at.is_(None))
        .first()
    )

def list_comments(
    db: Session,
    post_id: UUID,
    page: int = 1,
    per_page: int = 20,
    current_user_id: Optional[UUID] = None,
) -> Tuple[List[Tuple[Comment, User]], int]:
    """
    List comments for a post (non-deleted), with author.
    Returns (list of (comment, author), total_count).
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page

    q = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)
        .filter(Comment.post_id == post_id, Comment.deleted_at.is_(None))
    )
    total = q.count()
    rows = q.order_by(Comment.created_at.desc()).offset(offset).limit(per_page).all()
    return rows, total

def delete_comment(db: Session, comment_id: UUID, owner_user_id: UUID) -> bool:
    """Soft-delete a comment. Returns True if deleted, False if not found or not owner."""
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.deleted_at.is_(None))
        .first()
    )
    if not comment or comment.user_id != owner_user_id:
        return False
    from datetime import datetime, timezone
    comment.deleted_at = datetime.now(timezone.utc)
    db.add(comment)
    db.commit()
    return True

def get_reaction_counts_for_comments(
    db: Session, comment_ids: List[UUID]
) -> Dict[UUID, int]:
    """Return map comment_id -> reaction (like) count."""
    if not comment_ids:
        return {}
    rows = (
        db.query(Reaction.comment_id, func.count(Reaction.id))
        .filter(Reaction.comment_id.in_(comment_ids))
        .group_by(Reaction.comment_id)
    )
    return {r[0]: r[1] for r in rows}

def get_user_liked_comments(
    db: Session, user_id: UUID, comment_ids: List[UUID]
) -> set:
    """Return set of comment_ids the user has liked."""
    if not user_id or not comment_ids:
        return set()
    rows = (
        db.query(Reaction.comment_id)
        .filter(
            Reaction.user_id == user_id,
            Reaction.comment_id.in_(comment_ids),
        )
    )
    return {r[0] for r in rows}
