"""
Feed endpoint: GET /feed (all posts, exclude muted/blocked for current user).
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.post import (
    PostAuthor,
    PostInFeedResponse,
    PostStats,
    TickerInfo,
    UserInteractions,
)
from app.services.auth_service import CurrentUser
from app.services.feed_service import get_feed
from app.services.post_service import (
    _get_stats_for_posts,
    _get_user_interactions,
    get_post_tickers,
)

router = APIRouter(prefix="/feed", tags=["feed"])

def _post_response(post, author, stats: tuple, interactions: tuple, tickers: list) -> PostInFeedResponse:
    """Build PostInFeedResponse from post, author, stats, interactions, tickers."""
    likes, comments, reposts = stats
    liked, reposted = interactions
    ticker_list = [TickerInfo(symbol=s, name=n) for s, n in tickers]
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
        return {
            "data": [],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "has_next": False,
                "has_prev": page > 1,
            },
        }
    post_ids = [p.id for p, _ in rows]
    stats_map = _get_stats_for_posts(db, post_ids)
    interactions_map = _get_user_interactions(db, current_id, post_ids)
    tickers_map = {p.id: get_post_tickers(db, p.id) for p, _ in rows}
    data = [
        _post_response(
            p,
            u,
            stats_map.get(p.id, (0, 0, 0)),
            interactions_map.get(p.id, (False, False)),
            tickers_map.get(p.id, []),
        )
        for p, u in rows
    ]
    return {
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "has_next": page * per_page < total,
            "has_prev": page > 1,
        },
    }
