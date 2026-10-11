"""
Cron endpoint: daily DB touch + materialized view refresh + stale session cleanup.
Protects Supabase prod DB from inactivity (7-day pause) and keeps metrics views fresh.
Call from Vercel Cron or external cron with CRON_SECRET.
"""
import logging
from time import perf_counter
from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import text
from app.config import get_settings
from app.database import db_health_check, db_session
from app.services.session_service import close_stale_sessions
from app.services.polygon_anchor_service import retry_pending_anchors
from app.services.prediction_settle_service import SettleDueResult, settle_due_predictions

router = APIRouter(prefix="/cron", tags=["cron"])
logger = logging.getLogger("pageshare.cron")

settings = get_settings()

def _verify_cron_request(
    authorization: str | None,
    x_cron_secret: str | None,
) -> bool:
    """
    Verify cron secret via headers only.
    Accept Authorization: Bearer <CRON_SECRET> or X-Cron-Secret: <CRON_SECRET>.
    Query params are not accepted to avoid secret leakage in logs/referrers.
    """
    if not settings.cron_secret:
        return False
    secret = settings.cron_secret.strip()
    if x_cron_secret and x_cron_secret.strip() == secret:
        return True
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        return token == secret
    return False

def _require_cron_secret(
    authorization: str | None,
    x_cron_secret: str | None,
) -> None:
    if not _verify_cron_request(authorization, x_cron_secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing cron secret",
        )

def _refresh_materialized_view(db, view_name: str, *, concurrently: bool) -> str:
    qualifier = " CONCURRENTLY" if concurrently else ""
    try:
        db.execute(text(f"REFRESH MATERIALIZED VIEW{qualifier} {view_name}"))
        db.commit()
        return "ok"
    except Exception as exc:
        return str(exc)

@router.get("/daily")
async def cron_daily(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Daily cron: DB health check, refresh daily_metrics + engagement_metrics,
    stale session cleanup. Call once per day (e.g. 05:00 UTC).
    """
    _require_cron_secret(authorization, x_cron_secret)

    results = {
        "db_health": db_health_check(),
        "stale_sessions": None,
        "daily_metrics": None,
        "engagement_metrics": None,
    }
    try:
        with db_session() as db:
            try:
                results["stale_sessions"] = close_stale_sessions(db)
            except Exception as exc:
                results["stale_sessions"] = str(exc)
            results["daily_metrics"] = _refresh_materialized_view(
                db, "daily_metrics", concurrently=True
            )
            results["engagement_metrics"] = _refresh_materialized_view(
                db, "engagement_metrics", concurrently=False
            )
    except Exception as exc:
        results["error"] = str(exc)

    return {"ok": results["db_health"], "results": results}


@router.get("/sessions")
async def cron_stale_sessions(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Stale session cleanup: mark sessions as ended where no activity for 30+ min.
    Call every 30-60 min.
    """
    _require_cron_secret(authorization, x_cron_secret)
    try:
        with db_session() as db:
            closed = close_stale_sessions(db)
        return {"ok": True, "closed": closed}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}

@router.get("/anchor-predictions")
def cron_anchor_predictions(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Retry pending/failed/submitted Polygon hash anchors.
    Call every 10-15 min.

    Sync def so FastAPI runs this in a threadpool: retry_pending_anchors does
    blocking web3 RPC (including up to 120s receipt waits per row).
    """
    _require_cron_secret(authorization, x_cron_secret)
    try:
        with db_session() as db:
            results = retry_pending_anchors(db, settings)
        return {"ok": True, "results": results}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}

@router.get("/settle-predictions")
def cron_settle_predictions(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Settle expired predictions for all users so outcomes don't wait for someone
    to open them. Call every 30 min.

    Sync def so FastAPI runs this in a threadpool: Coinbase candle fetches are blocking.
    """
    _require_cron_secret(authorization, x_cron_secret)
    started = perf_counter()
    try:
        with db_session() as db:
            result = settle_due_predictions(db)
    except Exception as exc:
        logger.exception("Scheduled prediction settle failed")
        return {"ok": False, "error": str(exc)}

    return _settle_run_summary(result, elapsed_ms=round((perf_counter() - started) * 1000))

def _settle_run_summary(result: SettleDueResult, *, elapsed_ms: int) -> dict:
    """Log one line per run (for tuning batch size) and build the response body."""
    logger.info(
        "Scheduled prediction settle attempted=%s settled=%s failed=%s elapsed_ms=%s",
        result.attempted,
        result.settled,
        result.failed,
        elapsed_ms,
    )
    return {
        "ok": True,
        "attempted": result.attempted,
        "settled": result.settled,
        "failed": result.failed,
        "elapsed_ms": elapsed_ms,
    }
