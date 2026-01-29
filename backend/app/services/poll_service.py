"""
Poll vote and results. Check expiry (created_at + duration_days). One vote per user.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.poll import Poll
from app.models.poll_vote import PollVote

def get_poll_by_id(db: Session, poll_id: UUID) -> Optional[Poll]:
    """Get poll by id."""
    return db.get(Poll, poll_id)

def _poll_expires_at(poll: Poll) -> datetime:
    """Return poll expiry (created_at + duration_days)."""
    base = poll.created_at
    if base.tzinfo is None:
        base = base.replace(tzinfo=timezone.utc)
    return base + timedelta(days=poll.duration_days)

def is_poll_expired(poll: Poll) -> bool:
    """Return True if poll has expired."""
    return datetime.now(timezone.utc) >= _poll_expires_at(poll)

def vote(
    db: Session,
    poll_id: UUID,
    user_id: UUID,
    option_index: int,
) -> Tuple[Dict[int, int], int]:
    """
    Record vote. Returns (results map option_index -> count, total_votes).
    Raises ValueError if poll not found, expired, invalid option_index, or already voted.
    """
    poll = get_poll_by_id(db, poll_id)
    if not poll:
        raise ValueError("Poll not found")
    if is_poll_expired(poll):
        raise ValueError("Poll expired")
    n = len(poll.options) if poll.options else 0
    if option_index < 0 or option_index >= n:
        raise ValueError("Invalid option_index")
    existing = (
        db.query(PollVote)
        .filter(PollVote.poll_id == poll_id, PollVote.user_id == user_id)
        .first()
    )
    if existing:
        raise ValueError("Already voted")
    db.add(PollVote(poll_id=poll_id, user_id=user_id, option_index=option_index))
    db.commit()
    results, total, _, _, _ = get_results(db, poll_id, user_id=None)
    return results, total

def get_results(
    db: Session,
    poll_id: UUID,
    user_id: Optional[UUID] = None,
) -> Tuple[Dict[int, int], int, Optional[int], bool, datetime]:
    """
    Return (results map option_index -> count, total_votes, user_vote or None, is_finished, expires_at).
    """
    poll = get_poll_by_id(db, poll_id)
    if not poll:
        raise ValueError("Poll not found")
    expires_at = _poll_expires_at(poll)
    is_finished = datetime.now(timezone.utc) >= expires_at

    rows = (
        db.query(PollVote.option_index, func.count(PollVote.id))
        .filter(PollVote.poll_id == poll_id)
        .group_by(PollVote.option_index)
    )
    results = {r[0]: r[1] for r in rows}
    n = len(poll.options) if poll.options else 0
    for i in range(n):
        results.setdefault(i, 0)
    total = sum(results.values())

    user_vote = None
    if user_id:
        v = (
            db.query(PollVote.option_index)
            .filter(PollVote.poll_id == poll_id, PollVote.user_id == user_id)
            .first()
        )
        if v:
            user_vote = v[0]

    return results, total, user_vote, is_finished, expires_at

def user_has_voted(db: Session, poll_id: UUID, user_id: UUID) -> bool:
    """Return True if user has voted on this poll."""
    return (
        db.query(PollVote)
        .filter(PollVote.poll_id == poll_id, PollVote.user_id == user_id)
        .first()
        is not None
    )
