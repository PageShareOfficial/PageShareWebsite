"""
Reaction (like) toggle on posts and comments. One reaction per user per target.
"""
from __future__ import annotations
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.reaction import Reaction
from app.models.post import Post
from app.models.user import User

def toggle_post_reaction(
    db: Session, user_id: UUID, post_id: UUID
) -> tuple[bool, int]:
    """
    Toggle reaction on a post. Returns (reacted: bool, new_count: int).
    If user already reacted, remove and return (False, count-1). Else add and return (True, count+1).
    """
    existing = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == user_id,
            Reaction.post_id == post_id,
            Reaction.comment_id.is_(None),
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        count = (
            db.query(Reaction)
            .filter(Reaction.post_id == post_id, Reaction.comment_id.is_(None))
            .count()
        )
        return False, count
    db.add(
        Reaction(
            user_id=user_id,
            post_id=post_id,
            comment_id=None,
        )
    )
    db.commit()
    count = (
        db.query(Reaction)
        .filter(Reaction.post_id == post_id, Reaction.comment_id.is_(None))
        .count()
    )
    return True, count

def toggle_comment_reaction(
    db: Session, user_id: UUID, comment_id: UUID
) -> tuple[bool, int]:
    """
    Toggle reaction on a comment. Returns (reacted: bool, new_count: int).
    """
    existing = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == user_id,
            Reaction.comment_id == comment_id,
            Reaction.post_id.is_(None),
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        count = (
            db.query(Reaction)
            .filter(Reaction.comment_id == comment_id, Reaction.post_id.is_(None))
            .count()
        )
        return False, count
    db.add(
        Reaction(
            user_id=user_id,
            post_id=None,
            comment_id=comment_id,
        )
    )
    db.commit()
    count = (
        db.query(Reaction)
        .filter(Reaction.comment_id == comment_id, Reaction.post_id.is_(None))
        .count()
    )
    return True, count

def list_posts_liked_by_user(
    db: Session,
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Tuple[Post, User]], int]:
    """
    List posts liked by a user (post reactions only), with post author.
    Returns (list of (post, author), total_count). Ordered by reaction created_at desc.
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    subq = (
        db.query(Reaction.post_id)
        .filter(
            Reaction.user_id == user_id,
            Reaction.post_id.isnot(None),
            Reaction.comment_id.is_(None),
        )
        .distinct()
    )
    # Get reactions with created_at for ordering
    reactions = (
        db.query(Reaction.post_id, Reaction.created_at)
        .filter(
            Reaction.user_id == user_id,
            Reaction.post_id.isnot(None),
            Reaction.comment_id.is_(None),
        )
        .order_by(Reaction.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    if not reactions:
        total = (
            db.query(Reaction)
            .filter(
                Reaction.user_id == user_id,
                Reaction.post_id.isnot(None),
                Reaction.comment_id.is_(None),
            )
            .count()
        )
        return [], total
    post_ids = [r[0] for r in reactions]
    total = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == user_id,
            Reaction.post_id.isnot(None),
            Reaction.comment_id.is_(None),
        )
        .count()
    )
    rows = (
        db.query(Post, User)
        .join(User, Post.user_id == User.id)
        .filter(Post.id.in_(post_ids), Post.deleted_at.is_(None))
        .all()
    )
    # Preserve order from reactions
    order_map = {pid: i for i, pid in enumerate(post_ids)}
    rows_sorted = sorted(rows, key=lambda r: order_map.get(r[0].id, 0))
    return rows_sorted, total
