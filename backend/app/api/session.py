"""
Session tracking: start on login, end on logout.
Stale sessions are closed by cron.
"""
import hashlib
from uuid import UUID
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.auth_service import CurrentUser
from app.services.geolocation_service import extract_client_ip
from app.services.session_service import create_session, end_session

router = APIRouter(prefix="/session", tags=["session"])

@router.post("/start", status_code=status.HTTP_204_NO_CONTENT)
async def session_start(
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Create a new session for the current user if none active (idempotent).
    Call after login (auth callback) and when app loads with existing session.
    No-op if user has active session (session_end NULL, session_start within 30 min).
    Captures ip_address_hash and user_agent.
    """
    ip = extract_client_ip(request)
    ip_hash = hashlib.sha256(ip.encode("utf-8")).hexdigest() if ip else None
    user_agent = request.headers.get("user-agent")

    create_session(
        db,
        UUID(current_user.auth_user_id),
        user_agent=user_agent,
        ip_address_hash=ip_hash,
    )

@router.post("/end", status_code=status.HTTP_204_NO_CONTENT)
async def session_end(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    End the current session. Call before logout.
    """
    end_session(db, UUID(current_user.auth_user_id))
