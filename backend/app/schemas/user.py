from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, constr, validator

UsernameStr = constr(pattern=r"^[a-z0-9_]{3,50}$")  # type: ignore[call-arg]

class UserBase(BaseModel):
    username: UsernameStr
    display_name: constr(min_length=1, max_length=100)  # type: ignore[call-arg]
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    badge: Optional[str] = Field(
        default=None,
        description="User badge; DB enforces 'Verified' or 'Public' if set.",
    )
    timezone: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None

class UserStats(BaseModel):
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    stats: UserStats = UserStats()

    class Config:
        from_attributes = True

class PublicUserResponse(BaseModel):
    id: str
    username: UsernameStr
    display_name: str
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    badge: Optional[str] = None
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0
    is_following: Optional[bool] = None
    created_at: datetime

class UpdateUserRequest(BaseModel):
    display_name: Optional[constr(min_length=1, max_length=100)] = None  # type: ignore[call-arg]
    bio: Optional[str] = None
    timezone: Optional[str] = None
    country: Optional[str] = None
    date_of_birth: Optional[date] = None

class OnboardingRequest(BaseModel):
    username: UsernameStr
    display_name: constr(min_length=1, max_length=100)  # type: ignore[call-arg]
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    interests: List[constr(min_length=1, max_length=50)] = []  # type: ignore[call-arg]
    timezone: Optional[str] = None  # Browser-detected timezone

    @validator("interests", pre=True)
    def strip_interests(cls, v):
        if not v:
            return []
        return [item.strip() for item in v if isinstance(item, str) and item.strip()]
