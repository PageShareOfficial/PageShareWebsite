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
from app.services.user_service import get_user_by_id

router = APIRouter(tags=["content-filters"])

@router.post("/users/{user_id}/mute", response_model=dict, status_code=status.HTTP_201_CREATED)
def mute_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Mute a user. 409 if self or already muted."""
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
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
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    ok = unmute_user(db, UUID(current_user.auth_user_id), target_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Mute not found")

@router.post("/users/{user_id}/block", response_model=dict, status_code=status.HTTP_201_CREATED)
def block_user_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Block a user. 409 if self or already blocked."""
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    if not get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
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
    try:
        target_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    ok = unblock_user(db, UUID(current_user.auth_user_id), target_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Block not found")

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
            muted_at=None,
            blocked_at=created_at,
        )
        for u, created_at in blocked_rows
    ]
    return {"data": ContentFiltersResponse(muted_users=muted_users, blocked_users=blocked_users)}
