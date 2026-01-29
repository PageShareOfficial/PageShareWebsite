"""
Follow/unfollow users. List followers and following. Prevent self-follow.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.follow import Follow
from app.models.user import User

def follow_user(db: Session, follower_id: UUID, following_id: UUID) -> int:
    """
    Create follow relationship. Returns new follower_count for the followed user.
    Raises ValueError if self-follow or already following.
    """
    if follower_id == following_id:
        raise ValueError("Cannot follow self")
    existing = (
        db.query(Follow)
        .filter(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
        .first()
    )
    if existing:
        raise ValueError("Already following")
    db.add(Follow(follower_id=follower_id, following_id=following_id))
    db.commit()
    return _follower_count(db, following_id)

def unfollow_user(db: Session, follower_id: UUID, following_id: UUID) -> Optional[int]:
    """
    Remove follow relationship. Returns new follower_count for the unfollowed user,
    or None if the relationship did not exist.
    """
    row = (
        db.query(Follow)
        .filter(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
        .first()
    )
    if not row:
        return None
    db.delete(row)
    db.commit()
    return _follower_count(db, following_id)

def is_following(db: Session, follower_id: UUID, following_id: UUID) -> bool:
    """Return True if follower_id follows following_id."""
    if follower_id == following_id:
        return False
    return (
        db.query(Follow)
        .filter(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
        .first()
        is not None
    )

def _follower_count(db: Session, user_id: UUID) -> int:
    """Count of users who follow user_id."""
    return db.query(Follow).filter(Follow.following_id == user_id).count()

def list_followers(
    db: Session,
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
    current_user_id: Optional[UUID] = None,
) -> Tuple[List[Tuple[User, any]], int]:
    """
    List users who follow user_id (followers). Returns (list of (User, created_at), total).
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    q = (
        db.query(User, Follow.created_at)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id)
    )
    total = q.count()
    rows = q.order_by(Follow.created_at.desc()).offset(offset).limit(per_page).all()
    return rows, total

def list_following(
    db: Session,
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
    current_user_id: Optional[UUID] = None,
) -> Tuple[List[Tuple[User, any]], int]:
    """
    List users that user_id follows (following). Returns (list of (User, created_at), total).
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    q = (
        db.query(User, Follow.created_at)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id)
    )
    total = q.count()
    rows = q.order_by(Follow.created_at.desc()).offset(offset).limit(per_page).all()
    return rows, total
