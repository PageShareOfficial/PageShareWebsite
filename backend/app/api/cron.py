"""
Cron endpoint: daily DB touch + materialized view refresh + stale session cleanup.
Protects Supabase prod DB from inactivity (7-day pause) and keeps metrics views fresh.
Call from Vercel Cron or external cron with CRON_SECRET.
"""
from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import text
from app.config import get_settings
from app.database import db_health_check, db_session
from app.services.session_service import close_stale_sessions

router = APIRouter(prefix="/cron", tags=["cron"])

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

@router.get("/daily")
async def cron_daily(
    request: Request,
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Daily cron: touch DB (keeps Supabase prod active) and refresh materialized views.
    Call once per day (e.g. 05:00 UTC). Requires CRON_SECRET via headers only:
    - Authorization: Bearer <CRON_SECRET>
    - X-Cron-Secret: <CRON_SECRET>
    """
    if not _verify_cron_request(authorization, x_cron_secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing cron secret")

    results = {"db_health": False, "stale_sessions": None, "daily_metrics": None, "engagement_metrics": None, "trending_tickers": None}

    results["db_health"] = db_health_check()

    try:
        with db_session() as db:
            try:
                closed = close_stale_sessions(db)
                results["stale_sessions"] = closed
            except Exception as e:
                results["stale_sessions"] = str(e)
            try:
                db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics"))
                db.commit()
                results["daily_metrics"] = "ok"
            except Exception as e:
                results["daily_metrics"] = str(e)
            try:
                db.execute(text("REFRESH MATERIALIZED VIEW engagement_metrics"))
                db.commit()
                results["engagement_metrics"] = "ok"
            except Exception as e:
                results["engagement_metrics"] = str(e)
            try:
                db.execute(text("REFRESH MATERIALIZED VIEW trending_tickers"))
                db.commit()
                results["trending_tickers"] = "ok"
            except Exception as e:
                results["trending_tickers"] = str(e)
    except Exception as e:
        results["error"] = str(e)

    return {"ok": results["db_health"], "results": results}

@router.get("/sessions")
async def cron_stale_sessions(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
):
    """
    Stale session cleanup: mark sessions as ended where no activity for 30+ min.
    Call every 30-60 min. Requires CRON_SECRET via Authorization or X-Cron-Secret header.
    """
    if not _verify_cron_request(authorization, x_cron_secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing cron secret")

    try:
        with db_session() as db:
            closed = close_stale_sessions(db)
        return {"ok": True, "closed": closed}
    except Exception as e:
        return {"ok": False, "error": str(e)}
