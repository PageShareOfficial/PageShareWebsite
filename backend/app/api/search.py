"""
Search endpoint: GET /search (users and tickers only).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.search import SearchResponseData, SearchTickerItem, SearchUserItem
from app.services.search_service import search_tickers, search_users
from app.utils.responses import paginated_response

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=dict)
def search_endpoint(
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=1),
    type: str = Query("all", description="users, tickers, or all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """Unified search: users and tickers only. type=users|tickers|all."""
    type_lower = type.strip().lower() if type else "all"
    if type_lower not in ("users", "tickers", "all"):
        type_lower = "all"

    users: list = []
    tickers: list = []
    total_users = 0
    total_tickers = 0

    if type_lower in ("users", "all"):
        users_list, total_users = search_users(db, q, page=page, per_page=per_page)
        users = [
            SearchUserItem(
                id=str(u.id),
                username=u.username,
                display_name=u.display_name,
                profile_picture_url=u.profile_picture_url,
            )
            for u in users_list
        ]
    if type_lower in ("tickers", "all"):
        tickers_list, total_tickers = search_tickers(db, q, page=page, per_page=per_page)
        tickers = [
            SearchTickerItem(symbol=s, name=n)
            for s, n, _ in tickers_list
        ]

    total = total_users + total_tickers
    return paginated_response(
        SearchResponseData(users=users, tickers=tickers),
        page,
        per_page,
        total,
    )
