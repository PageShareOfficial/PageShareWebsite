"""
API-layer dependencies: get entity or 404. Keeps service layer free of HTTP.
"""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.user import User
from app.services.post_service import get_post_by_id
from app.services.user_service import get_user_by_id


def get_post_or_404(db: Session, post_id: UUID) -> Post:
    """Return post by id or raise 404. Use after parse_uuid_or_404 for path params."""
    post = get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post

def get_user_or_404(db: Session, user_id: str) -> User:
    """Return user by id (string UUID) or raise 404. Use after parse_uuid_or_404 for path params."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
