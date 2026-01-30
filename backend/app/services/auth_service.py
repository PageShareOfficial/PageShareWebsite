from dataclasses import dataclass
from typing import Any, Dict
from datetime import datetime, timezone
import jwt
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
    """
    if not token:
        raise AuthException(AuthErrorCode.AUTH_REQUIRED, "Authorization token is required")

    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise AuthException(AuthErrorCode.AUTH_INVALID, "Token has expired")
    except jwt.InvalidTokenError:
        raise AuthException(AuthErrorCode.AUTH_INVALID, "Invalid authentication token")

    sub = payload.get("sub")
    if not sub:
        raise AuthException(AuthErrorCode.AUTH_INVALID, "Token is missing 'sub' claim")

    # Optional: sanity check `exp` if present (PyJWT already enforces this).
    exp = payload.get("exp")
    if exp is not None:
        now = datetime.now(timezone.utc).timestamp()
        if now > float(exp):
            raise AuthException(AuthErrorCode.AUTH_INVALID, "Token has expired")

    return CurrentUser(auth_user_id=str(sub), claims=payload)
