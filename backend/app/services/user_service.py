import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import Iterable, List, Optional, Tuple
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post
from app.models.user_interest import UserInterest
from app.schemas.user import (
    DISPLAY_NAME_MAX_LENGTH,
    OnboardingRequest,
    UpdateUserRequest,
    UsernameStr,
)
from app.services.auth_service import CurrentUser
from app.services.storage_service import delete_profile_picture

logger = logging.getLogger("pageshare.user")

def _normalize_username(username: str) -> str:
    return username.strip().lower()

def is_onboarded(user: User) -> bool:
    """True once the user has completed onboarding."""
    return user.onboarded_at is not None

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Return user by normalized username, or None if not found."""
    normalized = _normalize_username(username)
    return db.execute(select(User).where(User.username == normalized)).scalars().first()

def _build_placeholder_user(current: CurrentUser) -> User:
    """
    Minimal bootstrap row; onboarding fills in the rest and sets `onboarded_at`.
    The user_{id} username is only a unique placeholder, not an onboarding signal.
    The name comes from OAuth claims we cannot reject, so it is truncated rather than validated.
    """
    display_name = current.claims.get("name") or current.claims.get("email") or "New User"
    return User(
        id=current.auth_user_id,
        username=f"user_{str(current.auth_user_id).replace('-', '').lower()[:24]}",
        display_name=display_name[:DISPLAY_NAME_MAX_LENGTH],
    )

def get_or_create_user_for_auth(db: Session, current: CurrentUser) -> User:
    """
    Ensure we have a row in `users` for the given Supabase auth user id.

    Safe under concurrent first-login requests (/session/start and /users/me):
    if another request inserts the row first, the existing row is returned.
    """
    user = db.get(User, current.auth_user_id)
    if user:
        return user

    user = _build_placeholder_user(current)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.get(User, current.auth_user_id)
        if existing is None:
            raise
        return existing
    db.refresh(user)
    return user

def apply_user_update(db: Session, user: User, payload: UpdateUserRequest) -> User:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.bio is not None:
        user.bio = payload.bio
    if payload.interests is not None:
        set_user_interests(db, str(user.id), payload.interests)
    if payload.timezone is not None:
        user.timezone = payload.timezone
    if payload.country is not None:
        user.country = payload.country
    if payload.date_of_birth is not None:
        user.date_of_birth = payload.date_of_birth

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

USERNAME_TAKEN_MESSAGE = "Username is already taken"

class UsernameTakenError(Exception):
    """The requested username belongs to another user."""

    def __init__(self) -> None:
        super().__init__(USERNAME_TAKEN_MESSAGE)

def validate_username_available(
    db: Session, username: UsernameStr, exclude_user_id: Optional[str] = None
) -> None:
    """Raise UsernameTakenError if username is already taken by another user."""
    normalized = _normalize_username(username)
    query = select(User).where(User.username == normalized)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    existing = db.execute(query).scalars().first()
    if existing:
        raise UsernameTakenError()

def _commit_onboarding(db: Session, user: User, username: str) -> None:
    """
    Commit the onboarded row. Another user claiming the same username between the availability
    check and the commit surfaces as UsernameTakenError; other integrity errors are re-raised.
    """
    user_id = str(user.id)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.warning("Onboarding commit conflict for user %s; re-checking username", user_id)
        validate_username_available(db, username, exclude_user_id=user_id)
        raise
    db.refresh(user)

def get_user_stats(db: Session, user_id: str) -> Tuple[int, int, int]:
    """
    Return (follower_count, following_count, post_count) for a user.
    """
    follower_q = select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    following_q = select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)
    post_q = select(func.count()).select_from(Post).where(Post.user_id == user_id, Post.deleted_at.is_(None))

    follower_count = db.execute(follower_q).scalar_one() or 0
    following_count = db.execute(following_q).scalar_one() or 0
    post_count = db.execute(post_q).scalar_one() or 0
    return follower_count, following_count, post_count

def get_user_interests(db: Session, user_id: str) -> List[str]:
    """Return list of interest names for the user."""
    rows = db.execute(
        select(UserInterest.interest).where(UserInterest.user_id == user_id).order_by(UserInterest.interest)
    ).scalars().all()
    return [r for r in rows]

def set_user_interests(db: Session, user_id: str, interests: Iterable[str]) -> None:
    """
    Replace the user's interests with the provided list.
    """
    uid = UUID(user_id) if isinstance(user_id, str) else user_id
    # Clear existing interests
    db.execute(delete(UserInterest).where(UserInterest.user_id == uid))
    for name in interests:
        db.add(UserInterest(user_id=uid, interest=name))
    db.commit()


def _get_or_build_user(db: Session, current: CurrentUser, payload: OnboardingRequest) -> User:
    user = db.get(User, current.auth_user_id)
    if user is not None:
        return user
    user = User(
        id=current.auth_user_id,
        username=_normalize_username(payload.username),
        display_name=payload.display_name,
    )
    db.add(user)
    return user

def _apply_profile_fields(user: User, payload: OnboardingRequest) -> None:
    user.username = _normalize_username(payload.username)
    user.display_name = payload.display_name
    user.bio = payload.bio
    user.date_of_birth = payload.date_of_birth
    user.timezone = payload.timezone or user.timezone
    if payload.profile_picture_url:
        user.profile_picture_url = payload.profile_picture_url

def _apply_geo_fields(
    user: User, country: Optional[str], country_code: Optional[str], ip_hash: Optional[str]
) -> None:
    """Geo lookup is best-effort, so missing values never overwrite known ones."""
    if country:
        user.country = country
    if country_code:
        user.country_code = country_code
    if ip_hash:
        user.ip_address_hash = ip_hash

def _mark_onboarded(user: User) -> None:
    """Keeps the first completion time if onboarding is submitted again."""
    if user.onboarded_at is None:
        user.onboarded_at = datetime.now(timezone.utc)

def apply_onboarding(
    db: Session,
    current: CurrentUser,
    payload: OnboardingRequest,
    country: Optional[str],
    country_code: Optional[str],
    ip_hash: Optional[str],
) -> User:
    """
    Create or update the User row during onboarding and mark the user as onboarded.
    Raises UsernameTakenError when the username belongs to another user.
    """
    validate_username_available(db, payload.username, exclude_user_id=current.auth_user_id)

    user = _get_or_build_user(db, current, payload)
    _apply_profile_fields(user, payload)
    _apply_geo_fields(user, country, country_code, ip_hash)
    _mark_onboarded(user)
    _commit_onboarding(db, user, payload.username)

    if payload.interests:
        set_user_interests(db, user.id, payload.interests)
    return user

def delete_account(db: Session, current: CurrentUser) -> None:
    """
    Hard delete the user account and all related data.
    - Deletes profile picture from storage (if ours)
    - Deletes user row (DB cascades to posts, comments, follows, etc.)
    Caller must also delete the Supabase auth user after this.
    """
    user = db.get(User, current.auth_user_id)
    if not user:
        logger.warning("delete_account: user not found for auth_user_id=%s", current.auth_user_id)
        return

    user_id_str = str(user.id)
    username = user.username

    # Delete profile picture from storage (no-op for Google/external URLs)
    if user.profile_picture_url:
        try:
            delete_profile_picture(url=user.profile_picture_url)
        except Exception as exc:
            logger.warning("Failed to delete profile picture for user %s: %s", user_id_str, exc)

    db.delete(user)
    db.commit()
    logger.info("Deleted user account: id=%s username=%s", user_id_str, username)
