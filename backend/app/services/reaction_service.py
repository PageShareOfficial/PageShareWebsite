"""
Reaction (like) toggle on posts and comments. One reaction per user per target.
"""
from __future__ import annotations
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.reaction import Reaction

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
