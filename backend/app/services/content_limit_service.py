"""Post/comment length limits by subscription tier."""

from uuid import UUID
from sqlalchemy.orm import Session
from app.services.subscription_service import is_premium_user

FREE_CONTENT_MAX_LENGTH = 280
PREMIUM_CONTENT_MAX_LENGTH = 10000

class ContentLengthExceeded(Exception):
    """Raised when content exceeds the user's plan character limit."""

    def __init__(self, max_length: int) -> None:
        self.max_length = max_length
        super().__init__(f"Content exceeds maximum length of {max_length} characters")

def get_max_content_length(db: Session, user_id: UUID) -> int:
    if is_premium_user(db, user_id):
        return PREMIUM_CONTENT_MAX_LENGTH
    return FREE_CONTENT_MAX_LENGTH

def assert_content_length_allowed(
    db: Session, user_id: UUID, content: str
) -> None:
    limit = get_max_content_length(db, user_id)
    if len(content or "") > limit:
        raise ContentLengthExceeded(limit)
