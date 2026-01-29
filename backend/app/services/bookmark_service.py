"""
Bookmark/unbookmark posts. List current user's bookmarked posts.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.bookmark import Bookmark
from app.models.post import Post
from app.models.user import User

def add_bookmark(db: Session, user_id: UUID, post_id: UUID) -> bool:
    """
    Add bookmark. Returns True if created. Raises ValueError if already bookmarked.
    """
    existing = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user_id, Bookmark.post_id == post_id)
        .first()
    )
    if existing:
        raise ValueError("Already bookmarked")
    db.add(Bookmark(user_id=user_id, post_id=post_id))
    db.commit()
    return True

def remove_bookmark(db: Session, user_id: UUID, post_id: UUID) -> bool:
    """Remove bookmark. Returns True if removed, False if not found."""
    row = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user_id, Bookmark.post_id == post_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def is_bookmarked(db: Session, user_id: UUID, post_id: UUID) -> bool:
    """Return True if user has bookmarked the post."""
    return (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user_id, Bookmark.post_id == post_id)
        .first()
        is not None
    )

def list_bookmarks(
    db: Session,
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Tuple[Post, User, any]], int]:
    """
    List user's bookmarked posts. Returns (list of (Post, Author, bookmarked_at), total).
    Only non-deleted posts.
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    q = (
        db.query(Post, User, Bookmark.created_at)
        .join(Bookmark, Bookmark.post_id == Post.id)
        .join(User, Post.user_id == User.id)
        .filter(Bookmark.user_id == user_id, Post.deleted_at.is_(None))
    )
    total = q.count()
    rows = q.order_by(Bookmark.created_at.desc()).offset(offset).limit(per_page).all()
    return rows, total
