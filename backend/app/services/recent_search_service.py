"""
Recent searches: list, add, remove. Per-user, backend source of truth.
"""
from __future__ import annotations
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.recent_search import RecentSearch

VALID_TYPES = ("account", "ticker")
MAX_RECENT = 20


def list_recent_searches(
    db: Session,
    user_id: UUID,
    limit: int = MAX_RECENT,
) -> List[RecentSearch]:
    """Return user's recent searches, newest first. Capped at limit."""
    limit = min(max(1, limit), 50)
    return (
        db.query(RecentSearch)
        .filter(RecentSearch.user_id == user_id)
        .order_by(RecentSearch.created_at.desc())
        .limit(limit)
        .all()
    )


def add_recent_search(
    db: Session,
    user_id: UUID,
    type: str,
    result_id: str,
    query: str,
    result_display_name: str | None = None,
    result_image_url: str | None = None,
) -> RecentSearch:
    """
    Add or refresh a recent search. If same user_id + type + result_id exists,
    remove the old one and add new (so it moves to top). Then trim to MAX_RECENT.
    """
    type_lower = (type or "").strip().lower()
    if type_lower not in VALID_TYPES:
        type_lower = "ticker"
    result_id = (result_id or "").strip()
    query = (query or "").strip() or result_id

    # Remove existing same (user, type, result_id)
    db.query(RecentSearch).filter(
        RecentSearch.user_id == user_id,
        RecentSearch.type == type_lower,
        RecentSearch.result_id == result_id,
    ).delete(synchronize_session=False)

    row = RecentSearch(
        user_id=user_id,
        type=type_lower,
        result_id=result_id,
        query=query,
        result_display_name=result_display_name or None,
        result_image_url=result_image_url or None,
    )
    db.add(row)
    db.flush()

    # Trim: keep only MAX_RECENT per user (by created_at desc)
    all_ids = [
        r.id
        for r in db.query(RecentSearch)
        .filter(RecentSearch.user_id == user_id)
        .order_by(RecentSearch.created_at.desc())
        .all()
    ]
    if len(all_ids) > MAX_RECENT:
        to_delete = all_ids[MAX_RECENT:]
        db.query(RecentSearch).filter(RecentSearch.id.in_(to_delete)).delete(
            synchronize_session=False
        )
    db.commit()
    db.refresh(row)
    return row


def remove_recent_search(db: Session, user_id: UUID, search_id: UUID) -> bool:
    """Remove one recent search by id. Returns True if deleted."""
    row = (
        db.query(RecentSearch)
        .filter(RecentSearch.id == search_id, RecentSearch.user_id == user_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def clear_recent_searches(db: Session, user_id: UUID) -> int:
    """Remove all recent searches for user. Returns count deleted."""
    deleted = db.query(RecentSearch).filter(RecentSearch.user_id == user_id).delete()
    db.commit()
    return deleted
