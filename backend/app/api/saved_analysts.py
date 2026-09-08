"""Saved analysts: investor bookmarks on prediction leaderboard."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.saved_analyst import SavedAnalystItem
from app.services.auth_service import CurrentUser
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    InvestorRequiredError,
    add_saved_analyst,
    assert_analyst_target,
    assert_investor_user,
    list_saved_analysts,
    remove_saved_analyst,
)
from app.services.subscription_service import get_active_plan_ids_for_users
from app.services.user_service import get_user_by_username
from app.utils.responses import paginated_response

router = APIRouter(prefix="/saved-analysts", tags=["saved-analysts"])

def _require_investor(db: Session, user_id: UUID) -> None:
    try:
        assert_investor_user(db, user_id)
    except InvestorRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

def _analyst_item(user, plan_id: str | None, saved_at) -> SavedAnalystItem:
    return SavedAnalystItem(
        id=str(user.id),
        handle=user.username,
        display_name=user.display_name or user.username,
        avatar=user.profile_picture_url or "",
        subscription_plan_id=plan_id,
        saved_at=saved_at,
    )

def _get_analyst_or_404(db: Session, username: str):
    analyst = get_user_by_username(db, username.strip())
    if not analyst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return analyst

@router.get("")
def list_saved_analysts_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
):
    investor_id = UUID(current_user.auth_user_id)
    _require_investor(db, investor_id)
    rows, total = list_saved_analysts(db, investor_id, page=page, per_page=per_page)
    analyst_ids = [user.id for user, _ in rows]
    plan_map = get_active_plan_ids_for_users(db, analyst_ids)
    data = [
        _analyst_item(user, plan_map.get(user.id), row.created_at)
        for user, row in rows
    ]
    return paginated_response(data, page, per_page, total)

@router.post("/{username}", status_code=status.HTTP_201_CREATED)
def save_analyst_endpoint(
    username: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    investor_id = UUID(current_user.auth_user_id)
    _require_investor(db, investor_id)
    analyst = _get_analyst_or_404(db, username)
    try:
        assert_analyst_target(db, analyst.id)
    except AnalystTargetRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    try:
        row = add_saved_analyst(db, investor_id, analyst.id)
    except ValueError as exc:
        message = str(exc)
        if "Cannot save yourself" in message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot save yourself",
            ) from exc
        if "Already saved" in message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already saved",
            ) from exc
        raise
    plan_map = get_active_plan_ids_for_users(db, [analyst.id])
    item = _analyst_item(analyst, plan_map.get(analyst.id), row.created_at)
    return {"data": item}

@router.delete("/{username}", status_code=status.HTTP_200_OK)
def unsave_analyst_endpoint(
    username: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    investor_id = UUID(current_user.auth_user_id)
    _require_investor(db, investor_id)
    analyst = _get_analyst_or_404(db, username)
    removed = remove_saved_analyst(db, investor_id, analyst.id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not saved")
    return {"data": {"saved": False}}
