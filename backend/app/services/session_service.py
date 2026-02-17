"""
User session and activity tracking.
- create_session: one row per login (session_end = NULL until logout or stale cleanup).
- end_session: set session_end when user logs out.
- close_stale_sessions: mark sessions older than inactivity threshold as ended.
- touch_user_activity: update users.last_active_at only (no user_sessions).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_session import UserSession

INACTIVITY_MINUTES = 30

def create_session(
    db: Session,
    user_id: UUID,
    *,
    user_agent: Optional[str] = None,
    ip_address_hash: Optional[str] = None,
    country_code: Optional[str] = None,
) -> None:
    """
    Create a new session for user (one per login/visit). Idempotent: only creates
    if no active session (session_end NULL and session_start within last 30 min).
    Call from auth callback and when app loads with existing session.
    """
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(minutes=INACTIVITY_MINUTES)

    active = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.session_end.is_(None),
            UserSession.session_start >= threshold,
        )
        .first()
    )
    if active:
        return

    db.add(
        UserSession(
            user_id=user_id,
            session_start=now,
            session_end=None,
            actions_count=0,
            user_agent=user_agent,
            ip_address_hash=ip_address_hash,
            country_code=country_code,
        )
    )
    db.commit()

def end_session(db: Session, user_id: UUID) -> None:
    """
    End the most recent session for user that has no session_end. Call on logout.
    """
    now = datetime.now(timezone.utc)
    session_row = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.session_end.is_(None),
        )
        .order_by(UserSession.session_start.desc())
        .first()
    )
    if session_row:
        session_row.session_end = now
        db.commit()

def close_stale_sessions(db: Session) -> int:
    """
    Mark sessions as ended where session_end IS NULL and session_start is older
    than INACTIVITY_MINUTES. Returns count of closed sessions.
    """
    threshold = datetime.now(timezone.utc) - timedelta(minutes=INACTIVITY_MINUTES)
    result = (
        db.query(UserSession)
        .filter(
            UserSession.session_end.is_(None),
            UserSession.session_start < threshold,
        )
        .update({UserSession.session_end: threshold}, synchronize_session=False)
    )
    db.commit()
    return result

def touch_user_activity(
    db: Session,
    user_id: UUID,
    *,
    user_agent: Optional[str] = None,
    ip_address_hash: Optional[str] = None,
    country_code: Optional[str] = None,
) -> None:
    """
    Update users.last_active_at only. Call after each authenticated request.
    """
    user = db.get(User, user_id)
    if user:
        user.last_active_at = datetime.now(timezone.utc)
        db.commit()
