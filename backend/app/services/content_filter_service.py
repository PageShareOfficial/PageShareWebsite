"""
Mute and block users. Prevent self-mute/block. List muted and blocked users.
"""
from __future__ import annotations
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.content_filter import ContentFilter
from app.models.user import User

def mute_user(db: Session, user_id: UUID, filtered_user_id: UUID) -> None:
    """Add mute. Raises ValueError if self or already muted."""
    if user_id == filtered_user_id:
        raise ValueError("Cannot mute self")
    existing = (
        db.query(ContentFilter)
        .filter(
            ContentFilter.user_id == user_id,
            ContentFilter.filtered_user_id == filtered_user_id,
            ContentFilter.filter_type == "mute",
        )
        .first()
    )
    if existing:
        raise ValueError("Already muted")
    db.add(ContentFilter(user_id=user_id, filtered_user_id=filtered_user_id, filter_type="mute"))
    db.commit()

def unmute_user(db: Session, user_id: UUID, filtered_user_id: UUID) -> bool:
    """Remove mute. Returns True if removed, False if not found."""
    row = (
        db.query(ContentFilter)
        .filter(
            ContentFilter.user_id == user_id,
            ContentFilter.filtered_user_id == filtered_user_id,
            ContentFilter.filter_type == "mute",
        )
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def block_user(db: Session, user_id: UUID, filtered_user_id: UUID) -> None:
    """Add block. Raises ValueError if self or already blocked."""
    if user_id == filtered_user_id:
        raise ValueError("Cannot block self")
    existing = (
        db.query(ContentFilter)
        .filter(
            ContentFilter.user_id == user_id,
            ContentFilter.filtered_user_id == filtered_user_id,
            ContentFilter.filter_type == "block",
        )
        .first()
    )
    if existing:
        raise ValueError("Already blocked")
    db.add(ContentFilter(user_id=user_id, filtered_user_id=filtered_user_id, filter_type="block"))
    db.commit()

def unblock_user(db: Session, user_id: UUID, filtered_user_id: UUID) -> bool:
    """Remove block. Returns True if removed, False if not found."""
    row = (
        db.query(ContentFilter)
        .filter(
            ContentFilter.user_id == user_id,
            ContentFilter.filtered_user_id == filtered_user_id,
            ContentFilter.filter_type == "block",
        )
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def list_muted(db: Session, user_id: UUID) -> List[Tuple[User, any]]:
    """List users muted by user_id. Returns list of (User, created_at)."""
    rows = (
        db.query(User, ContentFilter.created_at)
        .join(ContentFilter, ContentFilter.filtered_user_id == User.id)
        .filter(ContentFilter.user_id == user_id, ContentFilter.filter_type == "mute")
        .order_by(ContentFilter.created_at.desc())
        .all()
    )
    return list(rows)

def list_blocked(db: Session, user_id: UUID) -> List[Tuple[User, any]]:
    """List users blocked by user_id. Returns list of (User, created_at)."""
    rows = (
        db.query(User, ContentFilter.created_at)
        .join(ContentFilter, ContentFilter.filtered_user_id == User.id)
        .filter(ContentFilter.user_id == user_id, ContentFilter.filter_type == "block")
        .order_by(ContentFilter.created_at.desc())
        .all()
    )
    return list(rows)
