"""
Watchlist endpoints: GET /watchlist, POST /watchlist, DELETE /watchlist/{symbol}.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.watchlist import AddWatchlistRequest, AddWatchlistResponse, WatchlistItemResponse
from app.services.auth_service import CurrentUser
from app.services.watchlist_service import add_to_watchlist, list_watchlist, remove_from_watchlist

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

@router.get("", response_model=dict)
def list_watchlist_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get current user's watchlist. Price/change/image fetched by frontend from external APIs."""
    rows = list_watchlist(db, UUID(current_user.auth_user_id))
    return {
        "data": [WatchlistItemResponse(**r) for r in rows],
    }

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_to_watchlist_endpoint(
    body: AddWatchlistRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Add ticker to watchlist by symbol. 409 if already in watchlist."""
    symbol = body.symbol.strip().upper()
    if not symbol:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Symbol cannot be empty",
        )
    try:
        add_to_watchlist(db, UUID(current_user.auth_user_id), symbol)
        return {"data": AddWatchlistResponse(ticker=symbol)}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticker already in watchlist",
        )

@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist_endpoint(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Remove ticker from watchlist by symbol. 404 if not in watchlist."""
    symbol = symbol.strip().upper()
    ok = remove_from_watchlist(db, UUID(current_user.auth_user_id), symbol)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticker not in watchlist",
        )
