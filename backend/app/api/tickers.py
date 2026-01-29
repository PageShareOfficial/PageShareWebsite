"""
Ticker endpoints: GET /tickers/trending (from materialized view).
"""
from fastapi import APIRouter, Query
from app.database import get_db
from app.services.ticker_service import get_trending_tickers
from fastapi import Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/tickers", tags=["tickers"])

@router.get("/trending", response_model=dict)
def get_trending(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
):
    """Get trending tickers from materialized view (mentions_24h, mention_count)."""
    rows = get_trending_tickers(db, limit=limit)
    return {"data": rows}
