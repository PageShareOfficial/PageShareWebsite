"""
Feed endpoint: GET /feed (all posts, exclude muted/blocked for current user).
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.post import (
    PollInfo,
    PostAuthor,
    PostInFeedResponse,
    PostStats,
    TickerInfo,
    UserInteractions,
)
from app.services.auth_service import CurrentUser
from app.services.feed_service import get_feed
from app.utils.responses import paginated_response
from app.api.posts import _build_original_post_response
from app.services.post_service import (
    _get_stats_for_posts,
    _get_user_interactions,
    get_post_tickers,
)
from app.services.poll_service import get_polls_for_posts

router = APIRouter(prefix="/feed", tags=["feed"])

def _poll_info_from_tuple(t):
    """Build PollInfo from (poll_id, options, results, total, user_vote, is_finished, expires_at)."""
    if not t:
        return None
    poll_id, options, results, total_votes, user_vote, is_finished, expires_at = t
    return PollInfo(
        poll_id=poll_id,
        options=options,
        results=results,
        total_votes=total_votes,
        user_vote=user_vote,
        is_finished=is_finished,
        expires_at=expires_at,
    )

def _post_response(db: Session, post, author, stats: tuple, interactions: tuple, tickers: list, poll_info=None) -> PostInFeedResponse:
    """Build PostInFeedResponse from post, author, stats, interactions, tickers, optional poll, optional original_post for quote reposts."""
    likes, comments, reposts = stats
    liked, reposted = interactions
    ticker_list = [TickerInfo(symbol=s, name=n) for s, n in tickers]
    poll_obj = _poll_info_from_tuple(poll_info) if poll_info else None
    return PostInFeedResponse(
        id=str(post.id),
        author=PostAuthor(
            id=str(author.id),
            username=author.username,
            display_name=author.display_name,
            profile_picture_url=author.profile_picture_url,
            badge=author.badge,
        ),
        content=post.content,
        media_urls=post.media_urls,
        gif_url=post.gif_url,
        stats=PostStats(likes=likes, comments=comments, reposts=reposts),
        user_interactions=UserInteractions(liked=liked, reposted=reposted),
        tickers=ticker_list,
        created_at=post.created_at,
        poll=poll_obj,
        original_post_id=str(post.original_post_id) if getattr(post, "original_post_id", None) else None,
        repost_type=getattr(post, "repost_type", None) or None,
        original_post=_build_original_post_response(db, getattr(post, "original_post_id", None)),
    )

@router.get("", response_model=dict)
def get_feed_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """Get home feed: all posts, excluding posts from muted/blocked users. Auth required."""
    current_id = UUID(current_user.auth_user_id)
    rows, total = get_feed(db, current_id, page=page, per_page=per_page)
    if not rows:
        return paginated_response([], page, per_page, total, has_next=False)
    post_ids = [p.id for p, _ in rows]
    # For normal reposts, stats and "reposted"/"liked" refer to the *original* post
    # (Repost table stores original post_id; reactions are on the original).
    def logical_id(post):
        if getattr(post, "repost_type", None) == "normal" and getattr(post, "original_post_id", None):
            return post.original_post_id
        return post.id
    logical_ids = list({logical_id(p) for p, _ in rows})
    stats_map = _get_stats_for_posts(db, logical_ids)
    interactions_map = _get_user_interactions(db, current_id, logical_ids)
    tickers_map = {p.id: get_post_tickers(db, p.id) for p, _ in rows}
    poll_map = get_polls_for_posts(db, post_ids, current_id)
    data = [
        _post_response(
            db,
            p,
            u,
            stats_map.get(logical_id(p), (0, 0, 0)),
            interactions_map.get(logical_id(p), (False, False)),
            tickers_map.get(p.id, []),
            poll_map.get(p.id),
        )
        for p, u in rows
    ]
    return paginated_response(data, page, per_page, total)
