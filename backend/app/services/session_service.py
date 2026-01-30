"""
User session and activity tracking: update last_active_at and user_sessions.
One row per user per day (session_start = first request of day, session_end = last, actions_count).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_session import UserSession

def touch_user_activity(
    db: Session,
    user_id: UUID,
    *,
    user_agent: Optional[str] = None,
    ip_address_hash: Optional[str] = None,
    country_code: Optional[str] = None,
) -> None:
    """
    Update users.last_active_at and upsert user_sessions (one row per user per day).
    Call after each authenticated request for session/DAU-style tracking.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    # Update last_active_at on users
    user = db.get(User, user_id)
    if user:
        user.last_active_at = now
        db.flush()

    # Find or create today's session for this user
    session_row = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == user_id,
            UserSession.session_start >= today_start,
            UserSession.session_start < tomorrow_start,
        )
        .first()
    )
    if session_row:
        session_row.session_end = now
        session_row.actions_count = (session_row.actions_count or 0) + 1
        if user_agent is not None:
            session_row.user_agent = user_agent
        if ip_address_hash is not None:
            session_row.ip_address_hash = ip_address_hash
        if country_code is not None:
            session_row.country_code = country_code
    else:
        db.add(
            UserSession(
                user_id=user_id,
                session_start=now,
                session_end=now,
                actions_count=1,
                user_agent=user_agent,
                ip_address_hash=ip_address_hash,
                country_code=country_code,
            )
        )
    db.commit()
