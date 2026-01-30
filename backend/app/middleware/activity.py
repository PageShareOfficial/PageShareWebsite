"""
Middleware: touch user activity (last_active_at + user_sessions) on each authenticated request.
Parses Authorization Bearer and decodes JWT to get user_id; after request, updates DB.
"""
from uuid import UUID
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.database import SessionLocal
from app.services.auth_service import decode_jwt_user_id_optional
from app.services.session_service import touch_user_activity

def _get_user_id_from_request(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    return decode_jwt_user_id_optional(token)

class ActivityTrackingMiddleware(BaseHTTPMiddleware):
    """
    After each request: if Authorization Bearer is valid, update users.last_active_at
    and user_sessions (one row per user per day).
    """

    async def dispatch(self, request: Request, call_next):
        user_id_str = _get_user_id_from_request(request)
        response = await call_next(request)
        if not user_id_str:
            return response
        try:
            user_id = UUID(user_id_str)
        except (ValueError, TypeError):
            return response
        try:
            db = SessionLocal()
            try:
                user_agent = request.headers.get("user-agent")
                touch_user_activity(db, user_id, user_agent=user_agent)
            finally:
                db.close()
        except Exception:
            pass
        return response

def init_activity_tracking(app: FastAPI) -> None:
    """Attach activity tracking middleware."""
    app.add_middleware(ActivityTrackingMiddleware)
