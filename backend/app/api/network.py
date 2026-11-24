"""Public network stats for marketing rails."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.network import NetworkStatsResponse
from app.services.network_stats_service import get_network_stats

router = APIRouter(prefix="/network", tags=["network"])

CACHE_HEADERS = {
    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
}

@router.get("/stats", response_model=NetworkStatsResponse)
def network_stats(db: Session = Depends(get_db)) -> JSONResponse:
    """Prediction and saved-analyst totals for the right rail."""
    data = get_network_stats(db)
    return JSONResponse(
        content=NetworkStatsResponse(**data).model_dump(),
        headers=CACHE_HEADERS,
    )
    