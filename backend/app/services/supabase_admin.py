"""
Supabase admin operations (require service role key).
Used for auth user deletion, etc.
"""
from __future__ import annotations

import logging
import httpx
from app.config import get_settings

logger = logging.getLogger("pageshare.supabase_admin")


def delete_auth_user(user_id: str) -> None:
    """
    Delete a user from Supabase auth.users.
    Requires service role key. Raises on failure.
    Uses Supabase Auth Admin REST API.
    """
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}"

    with httpx.Client(timeout=10.0) as http:
        resp = http.delete(
            url,
            headers={
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "apikey": settings.supabase_anon_key,
            },
        )
        resp.raise_for_status()
    logger.info("Deleted Supabase auth user: %s", user_id)
