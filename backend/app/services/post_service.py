"""
Post CRUD, ticker extraction, stats, soft delete.
"""
from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.poll import Poll
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
    poll_options: Optional[List[str]] = None,
    poll_duration_days: Optional[int] = None,
) -> Post:
    """
    Create a post, extract tickers from content, link post_tickers.
    Optional poll: pass poll_options (2-4 items) and poll_duration_days (1-7) to attach a poll to the post.
    Content must be non-empty or media_urls/gif_url provided (caller/validator enforces).
    """
    post = Post(
        user_id=user_id,
        content=content.strip(),
        media_urls=media_urls,
        gif_url=gif_url,
    )
    db.add(post)
    db.flush()

    if poll_options is not None and len(poll_options) >= 2 and poll_duration_days is not None:
        poll = Poll(
            post_id=post.id,
            comment_id=None,
            options=poll_options,
            duration_days=min(7, max(1, poll_duration_days)),
        )
        db.add(poll)

    symbols = extract_tickers(post.content)
    if symbols:
        link_post_tickers(db, post.id, symbols)

    db.commit()
    db.refresh(post)
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
    exclude_user_ids: Optional[List[UUID]] = None,
) -> Tuple[List[Tuple[Post, User]], int]:
    """
    List posts (non-deleted), with author. Optional filter by user_id or ticker.
    exclude_user_ids: exclude posts from these user ids (e.g. muted/blocked).
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
    if exclude_user_ids:
        q = q.filter(Post.user_id.notin_(exclude_user_ids))
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

def list_posts_for_user_profile(
    db: Session,
    user_id: UUID,
    page: int = 1,
    per_page: int = 20,
    current_user_id: Optional[UUID] = None,
) -> Tuple[List[Tuple[Post, User, bool]], int]:
    """
    List posts for a user's profile.
    - Shows posts the profile user OWNS: originals + their quote reposts (they are the author).
    - Shows originals of posts the profile user normally reposted (so they see what they reposted).
    - Never shows someone else's quote repost (e.g. a quote of the profile user's post by another user).
    Returns (list of (post, author, is_normal_repost_by_user)), total_count.
    """
    per_page = min(max(1, per_page), 50)
    # 1) Posts owned by the profile user: originals (repost_type NULL) + their quote reposts (repost_type 'quote')
    own_rows = (
        db.query(Post, User)
        .join(User, Post.user_id == User.id)
        .filter(Post.deleted_at.is_(None), Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .all()
    )
    # 2) Normal reposts by this user: get (original post_id, repost.created_at)
    repost_rows = (
        db.query(Repost.post_id, Repost.created_at)
        .filter(Repost.user_id == user_id, Repost.type == "normal")
        .order_by(Repost.created_at.desc())
        .all()
    )
    own_ids = {p.id for p, _ in own_rows}
    repost_post_ids = [r[0] for r in repost_rows if r[0] not in own_ids]
    repost_created = {r[0]: r[1] for r in repost_rows}
    merged: List[Tuple[datetime, Post, User, bool]] = []
    for post, author in own_rows:
        merged.append((post.created_at, post, author, False))
    if repost_post_ids:
        repost_posts = (
            db.query(Post, User)
            .join(User, Post.user_id == User.id)
            .filter(Post.id.in_(repost_post_ids), Post.deleted_at.is_(None))
            .all()
        )
        for post, author in repost_posts:
            # Do not show on profile a quote repost that quotes this user's post (owner sees their own posts only)
            if getattr(post, "repost_type", None) == "quote" and getattr(post, "original_post_id", None) in own_ids:
                continue
            merged.append((repost_created[post.id], post, author, True))
    merged.sort(key=lambda x: x[0], reverse=True)
    # Exclude any quote repost not owned by the profile user (safety)
    merged = [(ts, p, u, is_rep) for ts, p, u, is_rep in merged if getattr(p, "repost_type", None) != "quote" or p.user_id == user_id]
    # Never show on a user's profile a quote repost that quotes THIS profile user's post (so UserA's profile doesn't show UserB's quote of UserA).
    # Exclude only when the quoted original is in own_ids; UserB's quote of UserA stays on UserB's profile (UserA's id not in own_ids when viewing UserB).
    merged = [
        (ts, p, u, is_rep)
        for ts, p, u, is_rep in merged
        if not (
            getattr(p, "repost_type", None) == "quote"
            and getattr(p, "original_post_id", None) is not None
            and (getattr(p, "original_post_id", None) in own_ids)
        )
    ]
    total = len(merged)
    offset = (page - 1) * per_page
    page_slice = merged[offset : offset + per_page]
    return [(p, u, is_rep) for _, p, u, is_rep in page_slice], total

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
