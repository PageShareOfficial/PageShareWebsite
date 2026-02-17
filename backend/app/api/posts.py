"""
Post endpoints: create, list, get by id, delete.
"""
from typing import Optional, Tuple
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.post import (
    CreatePostRequest,
    OriginalPostInResponse,
    PollInfo,
    PostAuthor,
    PostInFeedResponse,
    PostResponse,
    PostStats,
    TickerInfo,
    UserInteractions,
)
from app.services.auth_service import CurrentUser
from app.api.deps import get_post_or_404
from app.services.post_service import (
    create_post,
    delete_post,
    get_post_by_id,
    get_post_stats,
    get_post_tickers,
    list_posts,
    list_posts_for_user_profile,
    _get_stats_for_posts,
    _get_user_interactions,
)
from app.services.poll_service import get_poll_info_for_post, get_polls_for_posts
from app.models.user import User
from app.utils.http import parse_uuid_or_404
from app.utils.responses import paginated_response

router = APIRouter(prefix="/posts", tags=["posts"])

def _build_original_post_response(db: Session, original_post_id) -> Optional[OriginalPostInResponse]:
    """Fetch original post and author; return OriginalPostInResponse for embedding in quote reposts."""
    if not original_post_id:
        return None
    orig = get_post_by_id(db, original_post_id)
    if not orig:
        return None
    orig_author = db.get(User, orig.user_id)
    if not orig_author:
        return None
    return OriginalPostInResponse(
        id=str(orig.id),
        author=PostAuthor(
            id=str(orig_author.id),
            username=orig_author.username,
            display_name=orig_author.display_name,
            profile_picture_url=orig_author.profile_picture_url,
            badge=orig_author.badge,
        ),
        content=orig.content or "",
        media_urls=orig.media_urls,
        gif_url=orig.gif_url,
        created_at=orig.created_at,
    )

def _poll_info_from_tuple(t: tuple):
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

def _post_response(
    post,
    stats: tuple,
    user_interactions: tuple,
    tickers: list,
    *,
    include_author: bool = False,
    author=None,
    poll_info: Optional[Tuple] = None,
    reposted_by_profile_user: Optional[bool] = None,
    content_override: Optional[str] = None,
    original_post: Optional[OriginalPostInResponse] = None,
):
    """Build PostResponse or PostInFeedResponse from post + stats + interactions + tickers + optional poll + optional original_post for quote reposts."""
    likes, comments, reposts = stats
    liked, reposted = user_interactions
    ticker_list = [TickerInfo(symbol=s, name=n) for s, n in tickers]
    stats_obj = PostStats(likes=likes, comments=comments, reposts=reposts)
    interactions = UserInteractions(liked=liked, reposted=reposted)
    poll_obj = _poll_info_from_tuple(poll_info) if poll_info else None
    content = (content_override if content_override is not None else post.content) or ""

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
            content=content,
            media_urls=post.media_urls,
            gif_url=post.gif_url,
            stats=stats_obj,
            user_interactions=interactions,
            tickers=ticker_list,
            created_at=post.created_at,
            poll=poll_obj,
            original_post_id=str(post.original_post_id) if getattr(post, "original_post_id", None) else None,
            repost_type=getattr(post, "repost_type", None) or None,
            reposted_by_profile_user=reposted_by_profile_user,
            original_post=original_post,
        )
    return PostResponse(
        id=str(post.id),
        user_id=str(post.user_id),
        content=content,
        media_urls=post.media_urls,
        gif_url=post.gif_url,
        stats=stats_obj,
        user_interactions=interactions,
        tickers=ticker_list,
        created_at=post.created_at,
        poll=poll_obj,
    )

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post_endpoint(
    body: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new post. Tickers are extracted from content ($TICKER, #TICKER). Optional poll: 2-4 options, duration 1-7 days."""
    if not body.content.strip() and not body.media_urls and not body.gif_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content, media_urls, or gif_url required",
        )
    poll_options = body.poll.options if body.poll else None
    poll_duration = body.poll.duration_days if body.poll else None
    post = create_post(
        db,
        user_id=UUID(current_user.auth_user_id),
        content=body.content,
        media_urls=body.media_urls,
        gif_url=body.gif_url,
        poll_options=poll_options,
        poll_duration_days=poll_duration,
    )
    stats = get_post_stats(db, post.id)
    tickers = get_post_tickers(db, post.id)
    poll_info = get_poll_info_for_post(db, post.id, UUID(current_user.auth_user_id))
    return _post_response(
        post,
        stats,
        (False, False),
        tickers,
        poll_info=poll_info,
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
    """List posts (paginated). Optional filter by user_id or ticker symbol. When user_id is set, includes normal reposts."""
    user_id_uuid = UUID(user_id) if user_id else None
    current_id = UUID(current_user.auth_user_id) if current_user else None

    if user_id_uuid is not None and ticker is None:
        rows, total = list_posts_for_user_profile(
            db,
            user_id=user_id_uuid,
            page=page,
            per_page=per_page,
            current_user_id=current_id,
        )
        # rows: List[Tuple[Post, User, bool]] where bool = is_normal_repost_by_user
        triple = True
    else:
        rows, total = list_posts(
            db,
            page=page,
            per_page=per_page,
            user_id_filter=user_id_uuid,
            ticker_symbol=ticker,
            current_user_id=current_id,
        )
        triple = False

    if not rows:
        return paginated_response([], page, per_page, total)

    post_ids = [p.id for p, *_ in rows]
    stats_map = _get_stats_for_posts(db, post_ids)
    interactions_map = _get_user_interactions(db, current_id, post_ids)
    tickers_map = {p.id: get_post_tickers(db, p.id) for p, *_ in rows}
    poll_map = get_polls_for_posts(db, post_ids, current_id)

    if triple:
        # Same as feed: use post.content (no content_override). Quote posts have content on the Post row. Include original_post for quote reposts.
        data = [
            _post_response(
                p,
                stats_map.get(p.id, (0, 0, 0)),
                interactions_map.get(p.id, (False, False)),
                tickers_map.get(p.id, []),
                include_author=True,
                author=u,
                poll_info=poll_map.get(p.id),
                reposted_by_profile_user=is_repost,
                content_override=None,
                original_post=_build_original_post_response(db, getattr(p, "original_post_id", None)),
            )
            for p, u, is_repost in rows
        ]
    else:
        data = [
            _post_response(
                p,
                stats_map.get(p.id, (0, 0, 0)),
                interactions_map.get(p.id, (False, False)),
                tickers_map.get(p.id, []),
                include_author=True,
                author=u,
                poll_info=poll_map.get(p.id),
                original_post=_build_original_post_response(db, getattr(p, "original_post_id", None)),
            )
            for p, u in rows
        ]
    return paginated_response(data, page, per_page, total)

@router.get("/{post_id}", response_model=PostInFeedResponse)
def get_post_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Get a single post by id. Public (no auth required); returns post with author for shared links."""
    pid = parse_uuid_or_404(post_id, "Post not found")
    post = get_post_or_404(db, pid)
    author = db.get(User, post.user_id)
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    stats = get_post_stats(db, post.id)
    current_id = UUID(current_user.auth_user_id) if current_user else None
    interactions = _get_user_interactions(db, current_id, [post.id]).get(
        post.id, (False, False)
    )
    tickers = get_post_tickers(db, post.id)
    poll_info = get_poll_info_for_post(db, post.id, current_id)
    return _post_response(
        post,
        stats,
        interactions,
        tickers,
        include_author=True,
        author=author,
        poll_info=poll_info,
        original_post=_build_original_post_response(db, getattr(post, "original_post_id", None)),
    )

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Soft-delete a post. Only the owner can delete."""
    pid = parse_uuid_or_404(post_id, "Post not found")
    ok = delete_post(db, pid, UUID(current_user.auth_user_id))
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you are not the owner",
        )
