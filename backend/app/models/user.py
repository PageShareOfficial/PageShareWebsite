from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        # Supabase auth uses auth.users(id); we reference that PK.
        nullable=False,
    )
    username = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    bio = Column(Text)
    profile_picture_url = Column(Text)
    badge = Column(String(20))
    date_of_birth = Column(Date)
    timezone = Column(String(50))
    country = Column(String(100))
    country_code = Column(String(2))
    ip_address_hash = Column(String(64))
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_active_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "badge IN ('Verified', 'Public', 'admin')",
            name="users_badge_check",
        ),
        CheckConstraint(
            "username ~ '^[a-z0-9_]{3,50}$'",
            name="username_format",
        ),
        CheckConstraint(
            "username = LOWER(username)",
            name="username_lowercase",
        ),
    )
