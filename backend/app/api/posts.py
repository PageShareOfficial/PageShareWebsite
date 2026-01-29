"""
Post endpoints: create, list, get by id, delete.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.post import (
    CreatePostRequest,
    PostAuthor,
    PostInFeedResponse,
    PostResponse,
    PostStats,
    TickerInfo,
    UserInteractions,
)
from app.services.auth_service import CurrentUser
from app.services.post_service import (
    create_post,
    delete_post,
    get_post_by_id,
    get_post_stats,
    get_post_tickers,
    list_posts,
    _get_stats_for_posts,
    _get_user_interactions,
)

router = APIRouter(prefix="/posts", tags=["posts"])

def _post_response(
    post,
    stats: tuple,
    user_interactions: tuple,
    tickers: list,
    *,
    include_author: bool = False,
    author=None,
):
    """Build PostResponse or PostInFeedResponse from post + stats + interactions + tickers."""
    likes, comments, reposts = stats
    liked, reposted = user_interactions
    ticker_list = [TickerInfo(symbol=s, name=n) for s, n in tickers]
    stats_obj = PostStats(likes=likes, comments=comments, reposts=reposts)
    interactions = UserInteractions(liked=liked, reposted=reposted)

    if include_author and author:
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
            stats=stats_obj,
            user_interactions=interactions,
            tickers=ticker_list,
            created_at=post.created_at,
        )
    return PostResponse(
        id=str(post.id),
        user_id=str(post.user_id),
        content=post.content,
        media_urls=post.media_urls,
        gif_url=post.gif_url,
        stats=stats_obj,
        user_interactions=interactions,
        tickers=ticker_list,
        created_at=post.created_at,
    )

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post_endpoint(
    body: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new post. Tickers are extracted from content ($TICKER, #TICKER)."""
    if not body.content.strip() and not body.media_urls and not body.gif_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content, media_urls, or gif_url required",
        )
    post = create_post(
        db,
        user_id=UUID(current_user.auth_user_id),
        content=body.content,
        media_urls=body.media_urls,
        gif_url=body.gif_url,
    )
    stats = get_post_stats(db, post.id)
    tickers = get_post_tickers(db, post.id)
    return _post_response(
        post,
        stats,
        (False, False),
        tickers,
    )

@router.get("", response_model=dict)
def list_posts_endpoint(
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user_id: Optional[str] = Query(None),
    ticker: Optional[str] = Query(None),
):
    """List posts (paginated). Optional filter by user_id or ticker symbol."""
    user_id_uuid = UUID(user_id) if user_id else None
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_posts(
        db,
        page=page,
        per_page=per_page,
        user_id_filter=user_id_uuid,
        ticker_symbol=ticker,
        current_user_id=current_id,
    )
    if not rows:
        return {
            "data": [],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "has_next": page * per_page < total,
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
            stats_map.get(p.id, (0, 0, 0)),
            interactions_map.get(p.id, (False, False)),
            tickers_map.get(p.id, []),
            include_author=True,
            author=u,
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

@router.get("/{post_id}", response_model=PostResponse)
def get_post_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Get a single post by id."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    post = get_post_by_id(db, pid)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    stats = get_post_stats(db, post.id)
    current_id = UUID(current_user.auth_user_id) if current_user else None
    interactions = _get_user_interactions(db, current_id, [post.id]).get(
        post.id, (False, False)
    )
    tickers = get_post_tickers(db, post.id)
    return _post_response(post, stats, interactions, tickers)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Soft-delete a post. Only the owner can delete."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    ok = delete_post(db, pid, UUID(current_user.auth_user_id))
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you are not the owner",
        )
