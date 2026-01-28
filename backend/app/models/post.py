from sqlalchemy import (
    ARRAY,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from . import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content = Column(Text, nullable=False)
    media_urls = Column(ARRAY(Text))
    gif_url = Column(Text)
    original_post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="SET NULL"),
        nullable=True,
    )
    repost_type = Column(String(10))  # 'normal', 'quote', or NULL
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at = Column(DateTime(timezone=True))

    # Content length: DB allows up to 10K. Enforce 280 (normal) vs 10K (premium)
    # in API/service layer based on user tier; see post schemas & post_service.
    __table_args__ = (
        CheckConstraint(
            "(length(trim(content)) > 0) OR media_urls IS NOT NULL OR gif_url IS NOT NULL",
            name="posts_content_not_empty",
        ),
        CheckConstraint(
            "length(content) <= 10000",
            name="posts_max_content_length",
        ),
        CheckConstraint(
            "repost_type IN ('normal', 'quote') OR repost_type IS NULL",
            name="posts_repost_type_check",
        ),
    )

