from typing import Iterable, Optional, Tuple
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post
from app.models.user_interest import UserInterest
from app.schemas.user import OnboardingRequest, UpdateUserRequest, UsernameStr
from app.services.auth_service import CurrentUser, AuthException, AuthErrorCode

def _normalize_username(username: str) -> str:
    return username.strip().lower()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.get(User, user_id)

def get_or_create_user_for_auth(db: Session, current: CurrentUser) -> User:
    """
    Ensure we have a row in `users` for the given Supabase auth user id.

    For now we lazily create a minimal record when first needed.
    """
    user = db.get(User, current.auth_user_id)
    if user:
        return user

    # Minimal bootstrap; onboarding will fill in more details later.
    # Use user_{id} as placeholder so frontend can detect new users (needs onboarding).
    user = User(
        id=current.auth_user_id,
        username=f"user_{str(current.auth_user_id).replace('-', '').lower()[:24]}",
        display_name=current.claims.get("name") or current.claims.get("email", "New User"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def apply_user_update(db: Session, user: User, payload: UpdateUserRequest) -> User:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.bio is not None:
        user.bio = payload.bio
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

def validate_username_available(db: Session, username: UsernameStr, exclude_user_id: Optional[str] = None) -> None:
    """
    Raise AuthException if username is already taken by another user.
    """
    normalized = _normalize_username(username)
    query = select(User).where(User.username == normalized)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    existing = db.execute(query).scalars().first()
    if existing:
        raise AuthException(AuthErrorCode.AUTH_INVALID, "Username is already taken")

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

def set_user_interests(db: Session, user_id: str, interests: Iterable[str]) -> None:
    """
    Replace the user's interests with the provided list.
    """
    # Clear existing interests
    db.execute(delete(UserInterest).where(UserInterest.user_id == user_id))
    for name in interests:
        db.add(UserInterest(user_id=user_id, interest=name))
    db.commit()


def apply_onboarding(
    db: Session,
    current: CurrentUser,
    payload: OnboardingRequest,
    country: Optional[str],
    country_code: Optional[str],
    ip_hash: Optional[str],
) -> User:
    """
    Create or update the User row during onboarding.
    """
    # Ensure username is available (excluding this user if already exists)
    validate_username_available(db, payload.username, exclude_user_id=current.auth_user_id)

    user = db.get(User, current.auth_user_id)
    if user is None:
        user = User(
            id=current.auth_user_id,
            username=_normalize_username(payload.username),
            display_name=payload.display_name,
        )
        db.add(user)

    user.username = _normalize_username(payload.username)
    user.display_name = payload.display_name
    user.bio = payload.bio
    user.date_of_birth = payload.date_of_birth
    user.timezone = payload.timezone or user.timezone
    if country:
        user.country = country
    if country_code:
        user.country_code = country_code
    if ip_hash:
        user.ip_address_hash = ip_hash
    if payload.profile_picture_url:
        user.profile_picture_url = payload.profile_picture_url

    db.add(user)
    db.commit()
    db.refresh(user)

    # Interests
    if payload.interests:
        set_user_interests(db, user.id, payload.interests)

    return user
