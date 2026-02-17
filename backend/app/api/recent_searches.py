"""
Recent searches: GET/POST/DELETE under /users/me/recent-searches. Auth required.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.recent_search import RecentSearchCreate, RecentSearchItem
from app.services.auth_service import CurrentUser
from app.services.recent_search_service import (
    add_recent_search,
    clear_recent_searches,
    list_recent_searches,
    remove_recent_search,
)

router = APIRouter(prefix="/users/me", tags=["recent-searches"])

@router.get("/recent-searches", response_model=dict)
def list_recent_searches_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
):
    """Get current user's recent searches (newest first)."""
    rows = list_recent_searches(db, UUID(current_user.auth_user_id), limit=limit)
    return {
        "data": [
            RecentSearchItem(
                id=str(r.id),
                type=r.type,
                result_id=r.result_id,
                query=r.query,
                result_display_name=r.result_display_name,
                result_image_url=r.result_image_url,
                created_at=r.created_at,
            )
            for r in rows
        ],
    }

@router.post("/recent-searches", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_recent_search_endpoint(
    body: RecentSearchCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Add or refresh a recent search (account or ticker)."""
    row = add_recent_search(
        db,
        UUID(current_user.auth_user_id),
        type=body.type,
        result_id=body.result_id,
        query=body.query,
        result_display_name=body.result_display_name,
        result_image_url=body.result_image_url,
    )
    return {
        "data": RecentSearchItem(
            id=str(row.id),
            type=row.type,
            result_id=row.result_id,
            query=row.query,
            result_display_name=row.result_display_name,
            result_image_url=row.result_image_url,
            created_at=row.created_at,
        ),
    }

@router.delete("/recent-searches", status_code=status.HTTP_204_NO_CONTENT)
def clear_recent_searches_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Clear all recent searches for the current user."""
    clear_recent_searches(db, UUID(current_user.auth_user_id))

@router.delete("/recent-searches/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_recent_search_endpoint(
    search_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Remove one recent search by id."""
    try:
        sid = UUID(search_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if not remove_recent_search(db, UUID(current_user.auth_user_id), sid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
