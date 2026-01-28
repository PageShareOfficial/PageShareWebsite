from typing import Optional
from fastapi import Header
from app.services.auth_service import AuthErrorCode, AuthException, CurrentUser, verify_jwt

def _parse_authorization_header(authorization: Optional[str]) -> str:
    """
    Extract the Bearer token from the Authorization header.
    """
    if not authorization:
        raise AuthException(AuthErrorCode.AUTH_REQUIRED, "Authorization header is required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthException(
            AuthErrorCode.AUTH_MALFORMED,
            "Authorization header must be in the format 'Bearer <token>'",
        )

    return parts[1]

async def get_current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    """
    Dependency for endpoints that require authentication.
    """
    token = _parse_authorization_header(authorization)
    return verify_jwt(token)

async def get_optional_user(
    authorization: Optional[str] = Header(default=None),
) -> Optional[CurrentUser]:
    """
    Dependency for endpoints where authentication is optional.

    Returns:
        - CurrentUser when a valid token is provided
        - None when no/invalid token is provided
    """
    if not authorization:
        return None

    try:
        token = _parse_authorization_header(authorization)
        return verify_jwt(token)
    except AuthException:
        # Swallow auth errors for optional auth; caller can treat as anonymous.
        return None
