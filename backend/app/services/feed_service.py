"""
Feed: all posts, excluding posts from users the current user has muted or blocked.
No follow-based algo; content filters only.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.content_filter import ContentFilter
from app.services.post_service import list_posts

def _muted_and_blocked_user_ids(db: Session, user_id: UUID) -> List[UUID]:
    """Return list of user ids that user_id has muted or blocked."""
    rows = (
        db.query(ContentFilter.filtered_user_id)
        .filter(ContentFilter.user_id == user_id)
        .all()
    )
    return [r[0] for r in rows]

def get_feed(
    db: Session,
    current_user_id: UUID,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[list, int]:
    """
    Return (list of (Post, User), total) for feed: all posts excluding muted/blocked authors.
    Same shape as list_posts; uses list_posts with exclude_user_ids.
    """
    exclude = _muted_and_blocked_user_ids(db, current_user_id)
    return list_posts(
        db,
        page=page,
        per_page=per_page,
        user_id_filter=None,
        ticker_symbol=None,
        current_user_id=current_user_id,
        exclude_user_ids=exclude if exclude else None,
    )
