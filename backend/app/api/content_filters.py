"""
Content filter endpoints: mute/unmute, block/unblock, list filters.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.content_filter import (
    BlockResponse,
    ContentFiltersResponse,
    FilteredUserItem,
    MuteResponse,
)
from app.services.auth_service import CurrentUser
from app.services.content_filter_service import (
    block_user,
    list_blocked,
    list_muted,
    mute_user,
    unblock_user,
    unmute_user,
)
from app.api.deps import get_user_or_404
from app.services.user_service import get_user_by_id
from app.utils.http import parse_uuid_or_404

router = APIRouter(tags=["content-filters"])

@router.post("/users/{user_id}/mute", response_model=dict, status_code=status.HTTP_201_CREATED)
def mute_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Mute a user. 409 if self or already muted."""
    target_id = parse_uuid_or_404(user_id, "User not found")
    get_user_or_404(db, user_id)
    try:
        mute_user(db, UUID(current_user.auth_user_id), target_id)
        return {"data": MuteResponse()}
    except ValueError as e:
        if "Cannot mute self" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot mute self")
        if "Already muted" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already muted")
        raise

@router.delete("/users/{user_id}/mute", status_code=status.HTTP_204_NO_CONTENT)
def unmute_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Unmute a user."""
    target_id = parse_uuid_or_404(user_id, "User not found")
    ok = unmute_user(db, UUID(current_user.auth_user_id), target_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mute not found")

@router.post("/users/{user_id}/block", response_model=dict, status_code=status.HTTP_201_CREATED)
def block_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Block a user. 409 if self or already blocked."""
    target_id = parse_uuid_or_404(user_id, "User not found")
    get_user_or_404(db, user_id)
    try:
        block_user(db, UUID(current_user.auth_user_id), target_id)
        return {"data": BlockResponse()}
    except ValueError as e:
        if "Cannot block self" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot block self")
        if "Already blocked" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already blocked")
        raise

@router.delete("/users/{user_id}/block", status_code=status.HTTP_204_NO_CONTENT)
def unblock_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Unblock a user."""
    target_id = parse_uuid_or_404(user_id, "User not found")
    ok = unblock_user(db, UUID(current_user.auth_user_id), target_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

@router.get("/content-filters", response_model=dict)
def get_content_filters_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get current user's muted and blocked users."""
    muted_rows = list_muted(db, UUID(current_user.auth_user_id))
    blocked_rows = list_blocked(db, UUID(current_user.auth_user_id))
    muted_users = [
        FilteredUserItem(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            profile_picture_url=u.profile_picture_url,
            muted_at=created_at,
            blocked_at=None,
        )
        for u, created_at in muted_rows
    ]
    blocked_users = [
        FilteredUserItem(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            profile_picture_url=u.profile_picture_url,
            muted_at=None,
            blocked_at=created_at,
        )
        for u, created_at in blocked_rows
    ]
    return {"data": ContentFiltersResponse(muted_users=muted_users, blocked_users=blocked_users)}
