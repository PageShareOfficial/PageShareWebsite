from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.user import (
    OnboardingRequest,
    PublicUserResponse,
    UpdateUserRequest,
    UserResponse,
    UserStats,
)
from app.services.auth_service import CurrentUser
from app.services.geolocation_service import extract_client_ip, lookup_ip
from app.services.storage_service import delete_profile_picture, upload_profile_picture
from app.services.follow_service import is_following as follow_service_is_following
from app.services.user_service import (
    apply_onboarding,
    apply_user_update,
    get_or_create_user_for_auth,
    get_user_by_id,
    get_user_stats,
)
from app.utils.media_validator import validate_image_file

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_me(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    follower_count, following_count, post_count = get_user_stats(db, str(user.id))
    return UserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
    )

@router.get("/{user_id}", response_model=PublicUserResponse)
async def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    follower_count, following_count, post_count = get_user_stats(db, user_id)
    is_fol = follow_service_is_following(db, UUID(current_user.auth_user_id), user.id)

    return PublicUserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count,
        is_following=is_fol,
        created_at=user.created_at,
    )

@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    user = apply_user_update(db, user, payload)
    follower_count, following_count, post_count = get_user_stats(db, str(user.id))

    return UserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
    )

@router.post("/me/onboarding", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def onboarding(
    payload: OnboardingRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    ip = extract_client_ip(request)
    geo = await lookup_ip(ip) if ip else None
    user = apply_onboarding(
        db=db,
        current=current_user,
        payload=payload,
        country=geo.country if geo else None,
        country_code=geo.country_code if geo else None,
        ip_hash=geo.ip_hash if geo else None,
    )
    follower_count, following_count, post_count = get_user_stats(db, str(user.id))

    return UserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        profile_picture_url=user.profile_picture_url,
        badge=user.badge,
        timezone=user.timezone,
        country=user.country,
        country_code=user.country_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=UserStats(
            follower_count=follower_count,
            following_count=following_count,
            post_count=post_count,
        ),
    )

@router.post("/me/profile-picture")
async def upload_profile_picture_endpoint(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    file_bytes = await validate_image_file(file)

    # delete old picture if exists
    if user.profile_picture_url:
        delete_profile_picture(url=user.profile_picture_url)

    url = upload_profile_picture(
        user_id=str(user.id),
        file_bytes=file_bytes,
        filename=file.filename or "profile.jpg",
        content_type=file.content_type or "image/jpeg",
    )
    user.profile_picture_url = url
    db.add(user)
    db.commit()
    db.refresh(user)

    follower_count, following_count, post_count = get_user_stats(db, str(user.id))

    return {
        "data": UserResponse(
            id=str(user.id),
            username=user.username,
            display_name=user.display_name,
            bio=user.bio,
            profile_picture_url=user.profile_picture_url,
            badge=user.badge,
            timezone=user.timezone,
            country=user.country,
            country_code=user.country_code,
            created_at=user.created_at,
            updated_at=user.updated_at,
            stats=UserStats(
                follower_count=follower_count,
                following_count=following_count,
                post_count=post_count,
            ),
        )
    }

@router.delete("/me/profile-picture", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_picture_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_or_create_user_for_auth(db, current_user)
    if user.profile_picture_url:
        delete_profile_picture(url=user.profile_picture_url)
        user.profile_picture_url = None
        db.add(user)
        db.commit()
