from dataclasses import dataclass
from typing import Any, Dict
from datetime import datetime, timezone
import jwt
import httpx
from app.config import get_settings

settings = get_settings()

class AuthErrorCode:
    AUTH_REQUIRED = "AUTH_REQUIRED"
    AUTH_INVALID = "AUTH_INVALID"
    AUTH_MALFORMED = "AUTH_MALFORMED"

class AuthException(Exception):
    """
    Domain-level auth error so our error handler can format responses consistently.
    """

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)

@dataclass
class CurrentUser:
    """
    Lightweight representation of the authenticated user.

    For Phase 3 we only expose the Supabase auth user id (`sub`) and raw claims.
    Later phases can enrich this with our own `users` table data.
    """

    auth_user_id: str
    claims: Dict[str, Any]

def _get_jwt_secret() -> str:
    secret = settings.supabase_jwt_secret
    if not secret:
        raise RuntimeError("SUPABASE_JWT_SECRET is not configured")
    return secret


def _verify_via_supabase_api(token: str) -> CurrentUser | None:
    """
    Fallback: verify JWT by calling Supabase Auth API.
    Use when local JWT decode fails (e.g. project uses JWKS/RS256 instead of legacy secret).
    """
    url = settings.supabase_url
    anon_key = settings.supabase_anon_key
    if not url or not anon_key:
        return None
    base = url.rstrip("/")
    auth_url = f"{base}/auth/v1/user"
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(
                auth_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key,
                },
            )
        if r.status_code != 200:
            return None
        data = r.json()
        user_id = data.get("id")
        if not user_id:
            return None
        return CurrentUser(
            auth_user_id=str(user_id),
            claims={
                "sub": user_id,
                "email": data.get("email"),
                "name": data.get("user_metadata", {}).get("full_name") or data.get("user_metadata", {}).get("name"),
                **data.get("user_metadata", {}),
            },
        )
    except Exception:
        return None

def decode_jwt_user_id_optional(token: str) -> str | None:
    """
    Decode JWT and return sub (user_id) or None if invalid/expired.
    For middleware use only; does not raise.
    """
    if not token or not token.strip():
        return None
    try:
        payload = jwt.decode(
            token.strip(),
            _get_jwt_secret(),
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub") or None
    except Exception:
        return None

def verify_jwt(token: str) -> CurrentUser:
    """
    Verify a Supabase-issued JWT and return a CurrentUser.
    Tries local decode with JWT secret first; falls back to Supabase Auth API
    when that fails (e.g. project uses JWKS/RS256 instead of legacy HS256 secret).
    """
    if not token:
        raise AuthException(AuthErrorCode.AUTH_REQUIRED, "Authorization token is required")

    # 1. Try local JWT decode with legacy secret (HS256)
    secret = settings.supabase_jwt_secret
    if secret:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            sub = payload.get("sub")
            if sub:
                return CurrentUser(auth_user_id=str(sub), claims=payload)
        except jwt.ExpiredSignatureError:
            raise AuthException(AuthErrorCode.AUTH_INVALID, "Token has expired")
        except jwt.InvalidTokenError:
            pass  # Fall through to API verification

    # 2. Fallback: verify via Supabase Auth API (works for JWKS/RS256 and legacy)
    current = _verify_via_supabase_api(token)
    if current:
        return current

    raise AuthException(AuthErrorCode.AUTH_INVALID, "Invalid authentication token")
