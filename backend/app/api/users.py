import logging
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.user import (
    OnboardingRequest,
    PublicUserResponse,
    UpdateUserRequest,
    UserResponse,
    UserStats,
)
from app.services.auth_service import CurrentUser
from app.services.comment_service import (
    get_reaction_counts_for_comments,
    get_user_liked_comments,
    list_comments_by_user,
)
from app.services.geolocation_service import extract_client_ip, lookup_ip
from app.services.storage_service import delete_profile_picture, upload_profile_picture
from app.services.follow_service import is_following as follow_service_is_following
from app.schemas.poll import PollInfo
from app.api.posts import _build_original_post_response
from app.services.poll_service import get_polls_for_comments, get_polls_for_posts
from app.services.post_service import (
    _get_stats_for_posts,
    _get_user_interactions,
    get_post_tickers,
)
from app.services.reaction_service import list_posts_liked_by_user
from app.services.user_service import (
    apply_onboarding,
    apply_user_update,
    delete_account,
    get_or_create_user_for_auth,
    get_user_by_id,
    get_user_by_username,
    get_user_interests,
    get_user_stats,
)
from app.services.supabase_admin import delete_auth_user
from app.utils.media_validator import validate_image_file
from app.api.deps import get_user_or_404
from app.utils.http import parse_uuid_or_404
from app.utils.responses import paginated_response

router = APIRouter(prefix="/users", tags=["users"])

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

@router.get("/{user_id}/replies", response_model=dict)
def list_user_replies(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List comments (replies) written by this user. No auth required."""
    uid = parse_uuid_or_404(user_id, "User not found")
    get_user_or_404(db, user_id)
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_comments_by_user(db, uid, page=page, per_page=per_page)
    if not rows:
        return paginated_response([], page, per_page, total, has_next=False)
    comment_ids = [c.id for c, *_ in rows]
    post_ids = [post.id for _, _, post, _ in rows]
    like_counts = get_reaction_counts_for_comments(db, comment_ids)
    user_liked = get_user_liked_comments(db, current_id, comment_ids) if current_id else set()
    poll_map = get_polls_for_comments(db, comment_ids, current_id)
    post_poll_map = get_polls_for_posts(db, post_ids, current_id)
    data = []
    for c, c_author, post, p_author in rows:
        post_poll = _poll_info_from_tuple(post_poll_map.get(post.id))
        post_author_badge = getattr(p_author, "badge", None)
        data.append({
            "comment": {
                "id": str(c.id),
                "post_id": str(c.post_id),
                "author": {
                    "id": str(c_author.id),
                    "username": c_author.username,
                    "display_name": c_author.display_name,
                    "profile_picture_url": c_author.profile_picture_url,
                    "badge": getattr(c_author, "badge", None),
                },
                "content": c.content,
                "media_urls": c.media_urls,
                "gif_url": c.gif_url,
                "likes": like_counts.get(c.id, 0),
                "user_liked": c.id in user_liked,
                "created_at": c.created_at.isoformat(),
                "poll": _poll_info_from_tuple(poll_map.get(c.id)),
            },
            "post": {
                "id": str(post.id),
                "content": post.content or "",
                "media_urls": getattr(post, "media_urls", None),
                "gif_url": getattr(post, "gif_url", None),
                "author": {
                    "id": str(p_author.id),
                    "username": p_author.username,
                    "display_name": p_author.display_name,
                    "profile_picture_url": getattr(p_author, "profile_picture_url", None),
                    "badge": post_author_badge,
                },
                "created_at": post.created_at.isoformat() if post.created_at else None,
                "poll": post_poll,
                "original_post_id": str(post.original_post_id) if getattr(post, "original_post_id", None) else None,
                "repost_type": getattr(post, "repost_type", None),
                "original_post": _build_original_post_response(db, getattr(post, "original_post_id", None)),
            },
        })
    return paginated_response(data, page, per_page, total)

@router.get("/{user_id}/likes", response_model=dict)
def list_user_likes(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List posts liked by this user. No auth required."""
    uid = parse_uuid_or_404(user_id, "User not found")
    get_user_or_404(db, user_id)
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_posts_liked_by_user(db, uid, page=page, per_page=per_page)
    if not rows:
        return paginated_response([], page, per_page, total, has_next=False)
    from app.api.feed import _post_response as build_post_response
    post_ids = [p.id for p, _ in rows]
    stats_map = _get_stats_for_posts(db, post_ids)
    interactions_map = _get_user_interactions(db, current_id, post_ids)
    tickers_map = {p.id: get_post_tickers(db, p.id) for p, _ in rows}
    poll_map = get_polls_for_posts(db, post_ids, current_id)
    data = [
        build_post_response(
            db,
            p,
            u,
            stats_map.get(p.id, (0, 0, 0)),
            interactions_map.get(p.id, (False, False)),
            tickers_map.get(p.id, []),
            poll_map.get(p.id),
        )
        for p, u in rows
    ]
    return paginated_response(data, page, per_page, total)

@router.get("/me", response_model=UserResponse)
async def get_me(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    user_id = str(user.id)
    follower_count, following_count, post_count = get_user_stats(db, user_id)
    interests = get_user_interests(db, user_id)
    return UserResponse(
        id=user_id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
        interests=interests,
    )

@router.get("/by-username/{username}", response_model=PublicUserResponse)
async def get_user_by_username_endpoint(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Get public profile by username. No auth required; is_following present only when authenticated."""
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(user.id)
    follower_count, following_count, post_count = get_user_stats(db, user_id)
    is_fol = (
        follow_service_is_following(db, UUID(current_user.auth_user_id), user.id)
        if current_user
        else None
    )
    interests = get_user_interests(db, user_id)
    return PublicUserResponse(
        id=user_id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count,
        is_following=is_fol,
        interests=interests,
        created_at=user.created_at,
    )

@router.get("/{user_id}", response_model=PublicUserResponse)
async def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    parse_uuid_or_404(user_id, "User not found")
    user = get_user_or_404(db, user_id)

    follower_count, following_count, post_count = get_user_stats(db, user_id)
    is_fol = follow_service_is_following(db, UUID(current_user.auth_user_id), user.id)
    interests = get_user_interests(db, user_id)

    return PublicUserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count,
        is_following=is_fol,
        interests=interests,
        created_at=user.created_at,
    )

@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    user = apply_user_update(db, user, payload)
    user_id = str(user.id)
    follower_count, following_count, post_count = get_user_stats(db, user_id)
    interests = get_user_interests(db, user_id)

    return UserResponse(
        id=user_id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
        interests=interests,
    )

@router.post("/me/onboarding", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def onboarding(
    payload: OnboardingRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    ip = extract_client_ip(request)
    geo = await lookup_ip(ip) if ip else None
    user = apply_onboarding(
        db=db,
        current=current_user,
        payload=payload,
        country=geo.country if geo else None,
        country_code=geo.country_code if geo else None,
        ip_hash=geo.ip_hash if geo else None,
    )
    user_id = str(user.id)
    follower_count, following_count, post_count = get_user_stats(db, user_id)
    interests = get_user_interests(db, user_id)

    return UserResponse(
        id=user_id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
        interests=interests,
    )

@router.post("/me/profile-picture")
async def upload_profile_picture_endpoint(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    file_bytes = await validate_image_file(file)

    # delete old picture if exists
    if user.profile_picture_url:
        delete_profile_picture(url=user.profile_picture_url)

    url = upload_profile_picture(
        user_id=str(user.id),
        file_bytes=file_bytes,
        filename=file.filename or "profile.jpg",
        content_type=file.content_type or "image/jpeg",
    )
    user.profile_picture_url = url
    db.add(user)
    db.commit()
    db.refresh(user)

    user_id = str(user.id)
    follower_count, following_count, post_count = get_user_stats(db, user_id)
    interests = get_user_interests(db, user_id)

    return {
        "data": UserResponse(
            id=user_id,
            username=user.username,
            display_name=user.display_name,
            bio=user.bio,
            profile_picture_url=user.profile_picture_url,
            badge=user.badge,
            timezone=user.timezone,
            country=user.country,
            country_code=user.country_code,
            created_at=user.created_at,
            updated_at=user.updated_at,
            stats=UserStats(
                follower_count=follower_count,
                following_count=following_count,
                post_count=post_count,
            ),
            interests=interests,
        )
    }

@router.delete("/me/profile-picture", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_picture_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    if user.profile_picture_url:
        delete_profile_picture(url=user.profile_picture_url)
        user.profile_picture_url = None
        db.add(user)
        db.commit()

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Permanently delete the current user's account and all associated data."""
    auth_user_id = str(current_user.auth_user_id)
    delete_account(db, current_user)
    try:
        delete_auth_user(auth_user_id)
    except Exception as exc:
        # User already deleted from our DB; log and re-raise so client gets error
        logging.getLogger("pageshare.api").warning(
            "Deleted user from DB but Supabase auth delete failed for %s: %s",
            auth_user_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account data was removed but auth deletion failed. Please contact support.",
        ) from exc
