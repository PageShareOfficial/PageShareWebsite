"""
Post CRUD, ticker extraction, stats, soft delete.
"""
from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.post import Post
from app.models.reaction import Reaction
from app.models.repost import Repost
from app.models.user import User
from app.services.ticker_service import link_post_tickers
from app.utils.ticker_extractor import extract_tickers

def _get_stats_for_posts(
    db: Session, post_ids: List[UUID]
) -> Dict[UUID, Tuple[int, int, int]]:
    """Return map post_id -> (reaction_count, comment_count, repost_count)."""
    if not post_ids:
        return {}
    out: Dict[UUID, Tuple[int, int, int]] = {pid: (0, 0, 0) for pid in post_ids}

    # Reactions per post
    r = (
        db.query(Reaction.post_id, func.count(Reaction.id))
        .filter(Reaction.post_id.in_(post_ids))
        .group_by(Reaction.post_id)
    )
    for row in r:
        out[row[0]] = (row[1], out[row[0]][1], out[row[0]][2])

    # Comments per post (non-deleted)
    c = (
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids), Comment.deleted_at.is_(None))
        .group_by(Comment.post_id)
    )
    for row in c:
        out[row[0]] = (out[row[0]][0], row[1], out[row[0]][2])

    # Reposts per post
    rp = (
        db.query(Repost.post_id, func.count(Repost.id))
        .filter(Repost.post_id.in_(post_ids))
        .group_by(Repost.post_id)
    )
    for row in rp:
        out[row[0]] = (out[row[0]][0], out[row[0]][1], row[1])

    return out

def _get_user_interactions(
    db: Session, user_id: Optional[UUID], post_ids: List[UUID]
) -> Dict[UUID, Tuple[bool, bool]]:
    """Return map post_id -> (liked, reposted)."""
    if not user_id or not post_ids:
        return {pid: (False, False) for pid in post_ids}

    liked = set(
        r[0]
        for r in db.query(Reaction.post_id).filter(
            Reaction.user_id == user_id,
            Reaction.post_id.in_(post_ids),
        )
    )
    reposted = set(
        r[0]
        for r in db.query(Repost.post_id).filter(
            Repost.user_id == user_id,
            Repost.post_id.in_(post_ids),
        )
    )
    return {
        pid: (pid in liked, pid in reposted)
        for pid in post_ids
    }

def create_post(
    db: Session,
    user_id: UUID,
    content: str,
    media_urls: Optional[List[str]] = None,
    gif_url: Optional[str] = None,
) -> Post:
    """
    Create a post, extract tickers from content, link post_tickers.
    Content must be non-empty or media_urls/gif_url provided (caller/validator enforces).
    """
    post = Post(
        user_id=user_id,
        content=content.strip(),
        media_urls=media_urls,
        gif_url=gif_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    symbols = extract_tickers(post.content)
    if symbols:
        link_post_tickers(db, post.id, symbols)

    return post

def get_post_by_id(db: Session, post_id: UUID) -> Optional[Post]:
    """Get a single post by id; exclude soft-deleted."""
    return (
        db.query(Post)
        .filter(Post.id == post_id, Post.deleted_at.is_(None))
        .first()
    )

def list_posts(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    user_id_filter: Optional[UUID] = None,
    ticker_symbol: Optional[str] = None,
    current_user_id: Optional[UUID] = None,
) -> Tuple[List[Tuple[Post, User]], int]:
    """
    List posts (non-deleted), with author. Optional filter by user_id or ticker.
    Returns (list of (post, author), total_count).
    """
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page

    q = (
        db.query(Post, User)
        .join(User, Post.user_id == User.id)
        .filter(Post.deleted_at.is_(None))
    )
    if user_id_filter is not None:
        q = q.filter(Post.user_id == user_id_filter)
    if ticker_symbol:
        from app.models.post_ticker import PostTicker
        from app.models.ticker import Ticker
        subq = (
            select(PostTicker.post_id)
            .join(Ticker, PostTicker.ticker_id == Ticker.id)
            .where(Ticker.symbol == ticker_symbol.strip().upper())
        )
        q = q.filter(Post.id.in_(subq))

    total = q.count()
    rows = q.order_by(Post.created_at.desc()).offset(offset).limit(per_page).all()
    return rows, total

def delete_post(db: Session, post_id: UUID, owner_user_id: UUID) -> bool:
    """
    Soft-delete a post. Returns True if deleted, False if not found or not owner.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.deleted_at.is_(None)).first()
    if not post or post.user_id != owner_user_id:
        return False
    from datetime import datetime, timezone
    post.deleted_at = datetime.now(timezone.utc)
    db.add(post)
    db.commit()
    return True

def get_post_tickers(db: Session, post_id: UUID) -> List[Tuple[str, Optional[str]]]:
    """Return list of (symbol, name) for tickers linked to this post."""
    from app.models.post_ticker import PostTicker
    from app.models.ticker import Ticker
    rows = (
        db.query(Ticker.symbol, Ticker.name)
        .join(PostTicker, PostTicker.ticker_id == Ticker.id)
        .filter(PostTicker.post_id == post_id)
        .all()
    )
    return [(r[0], r[1]) for r in rows]

def get_post_stats(db: Session, post_id: UUID) -> Tuple[int, int, int]:
    """Return (reaction_count, comment_count, repost_count) for one post."""
    d = _get_stats_for_posts(db, [post_id])
    return d.get(post_id, (0, 0, 0))
