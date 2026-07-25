"""Build API author objects with optional subscription plan."""

from typing import Dict, Optional
from uuid import UUID
from app.models.user import User
from app.schemas.comment import CommentAuthor
from app.schemas.post import PostAuthor
from app.services.billing_constants import normalize_plan_id
from app.services.subscription_service import get_active_plan_ids_for_users

def _normalize_plan_id(plan_id: Optional[str]) -> Optional[str]:
    return normalize_plan_id(plan_id)

def build_post_author(
    user: User, subscription_plan_id: Optional[str] = None
) -> PostAuthor:
    return PostAuthor(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        profile_picture_url=user.profile_picture_url,
        subscription_plan_id=_normalize_plan_id(subscription_plan_id),
    )

def build_comment_author(
    user: User, subscription_plan_id: Optional[str] = None
) -> CommentAuthor:
    return CommentAuthor(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        profile_picture_url=user.profile_picture_url,
        subscription_plan_id=_normalize_plan_id(subscription_plan_id),
    )

def load_subscription_plan_map(
    db, user_ids: list[UUID]
) -> Dict[UUID, str]:
    return get_active_plan_ids_for_users(db, user_ids)
