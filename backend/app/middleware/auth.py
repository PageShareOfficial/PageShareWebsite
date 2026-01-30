from typing import Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
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

async def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """
    Dependency for endpoints that require admin (user.badge == 'admin').
    Use only for metrics and errors admin APIs.
    """
    user = db.get(User, UUID(current_user.auth_user_id))
    if not user or user.badge != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

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
