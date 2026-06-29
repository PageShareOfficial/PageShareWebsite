"""HTTP helpers for content length enforcement."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.content_limit_service import (
    ContentLengthExceeded,
    PREMIUM_CONTENT_MAX_LENGTH,
    assert_content_length_allowed,
)


def enforce_content_length_for_user(
    db: Session, user_id: UUID, content: str
) -> None:
    try:
        assert_content_length_allowed(db, user_id, content)
    except ContentLengthExceeded as exc:
        upgrade_hint = (
            f" Upgrade to premium for up to {PREMIUM_CONTENT_MAX_LENGTH:,} characters."
            if exc.max_length < PREMIUM_CONTENT_MAX_LENGTH
            else ""
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Content exceeds the {exc.max_length:,} character limit "
                f"for your plan.{upgrade_hint}"
            ),
        ) from exc
