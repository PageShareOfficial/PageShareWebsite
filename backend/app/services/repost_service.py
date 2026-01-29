"""
Repost: normal (just reposts row) and quote (reposts row + new post with original_post_id).
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.post import Post
from app.models.repost import Repost

def create_normal_repost(db: Session, user_id: UUID, post_id: UUID) -> Repost:
    """Create a normal repost. Raises if already reposted (unique user_id, post_id)."""
    existing = (
        db.query(Repost)
        .filter(Repost.user_id == user_id, Repost.post_id == post_id)
        .first()
    )
    if existing:
        raise ValueError("Already reposted")
    repost = Repost(user_id=user_id, post_id=post_id, type="normal", quote_content=None)
    db.add(repost)
    db.commit()
    db.refresh(repost)
    return repost

def create_quote_repost(
    db: Session,
    user_id: UUID,
    post_id: UUID,
    quote_content: str,
    media_urls: Optional[List[str]] = None,
    gif_url: Optional[str] = None,
) -> tuple[Repost, Post]:
    """
    Create a quote repost: one reposts row and one new post (repost_type='quote', original_post_id).
    Raises if already reposted.
    """
    existing = (
        db.query(Repost)
        .filter(Repost.user_id == user_id, Repost.post_id == post_id)
        .first()
    )
    if existing:
        raise ValueError("Already reposted")
    content = quote_content.strip() if quote_content else ""
    if not content and not media_urls and not gif_url:
        raise ValueError("Quote repost requires content, media_urls, or gif_url")
    post = Post(
        user_id=user_id,
        content=content or " ",  # DB allows empty if media/gif present
        media_urls=media_urls,
        gif_url=gif_url,
        original_post_id=post_id,
        repost_type="quote",
    )
    db.add(post)
    db.flush()
    repost = Repost(
        user_id=user_id,
        post_id=post_id,
        type="quote",
        quote_content=quote_content or None,
    )
    db.add(repost)
    db.commit()
    db.refresh(repost)
    db.refresh(post)
    return repost, post

def delete_repost(db: Session, user_id: UUID, post_id: UUID) -> bool:
    """
    Remove repost. If it was a quote repost, also soft-delete the quote post we created.
    Returns True if removed, False if not found.
    """
    repost = (
        db.query(Repost)
        .filter(Repost.user_id == user_id, Repost.post_id == post_id)
        .first()
    )
    if not repost:
        return False
    if repost.type == "quote":
        quote_post = (
            db.query(Post)
            .filter(
                Post.user_id == user_id,
                Post.original_post_id == post_id,
                Post.repost_type == "quote",
                Post.deleted_at.is_(None),
            )
            .first()
        )
        if quote_post:
            quote_post.deleted_at = datetime.now(timezone.utc)
            db.add(quote_post)
    db.delete(repost)
    db.commit()
    return True

def get_repost_count(db: Session, post_id: UUID) -> int:
    """Return number of reposts for a post."""
    return db.query(Repost).filter(Repost.post_id == post_id).count()

def user_has_reposted(db: Session, user_id: UUID, post_id: UUID) -> bool:
    """Return True if user has reposted this post."""
    return (
        db.query(Repost)
        .filter(Repost.user_id == user_id, Repost.post_id == post_id)
        .first()
        is not None
    )
