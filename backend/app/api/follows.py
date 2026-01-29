"""
Follow endpoints: follow/unfollow, list followers/following.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.follow import FollowToggleResponse, FollowerFollowingItem
from app.services.auth_service import CurrentUser
from app.services.follow_service import (
    follow_user,
    is_following,
    list_followers,
    list_following,
    unfollow_user,
)
from app.services.user_service import get_user_by_id

router = APIRouter(tags=["follows"])

@router.post("/users/{user_id}/follow", response_model=dict, status_code=status.HTTP_201_CREATED)
def follow_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Follow a user. 409 if already following or self."""
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    try:
        follower_count = follow_user(db, UUID(current_user.auth_user_id), target_id)
        return {"data": FollowToggleResponse(following=True, follower_count=follower_count)}
    except ValueError as e:
        if "Cannot follow self" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot follow self")
        if "Already following" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already following")
        raise

@router.delete("/users/{user_id}/follow", response_model=dict)
def unfollow_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Unfollow a user. 404 if not following."""
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    result = unfollow_user(db, UUID(current_user.auth_user_id), target_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    return {"data": FollowToggleResponse(following=False, follower_count=result)}

@router.get("/users/{user_id}/followers", response_model=dict)
def list_followers_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List user's followers (paginated). Optional auth for is_following on each."""
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_followers(db, uid, page=page, per_page=per_page, current_user_id=current_id)
    # For each follower, is_following = whether current user follows that follower
    data = []
    for user, followed_at in rows:
        is_fol = is_following(db, current_id, user.id) if current_id else False
        data.append(
            FollowerFollowingItem(
                id=str(user.id),
                username=user.username,
                display_name=user.display_name,
                profile_picture_url=user.profile_picture_url,
                is_following=is_fol,
                followed_at=followed_at,
            )
        )
    return {
        "data": data,
        "pagination": {"page": page, "per_page": per_page, "total": total},
    }

@router.get("/users/{user_id}/following", response_model=dict)
def list_following_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List users that user_id follows (paginated). is_following=true for listed users."""
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_following(db, uid, page=page, per_page=per_page, current_user_id=current_id)
    data = []
    for user, followed_at in rows:
        # Listed user is "following" from perspective of the profile user; is_following = current user follows them
        is_fol = is_following(db, current_id, user.id) if current_id else False
        data.append(
            FollowerFollowingItem(
                id=str(user.id),
                username=user.username,
                display_name=user.display_name,
                profile_picture_url=user.profile_picture_url,
                is_following=is_fol,
                followed_at=followed_at,
            )
        )
    return {
        "data": data,
        "pagination": {"page": page, "per_page": per_page, "total": total},
    }