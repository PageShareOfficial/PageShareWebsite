from sqlalchemy import (
    ARRAY,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from . import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )
    content = Column(Text, nullable=False)
    media_urls = Column(ARRAY(Text))
    gif_url = Column(Text)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at = Column(DateTime(timezone=True))

    # Content length: DB allows up to 10K. Enforce 280 (normal) vs 10K (premium)
    # in API/service layer based on user tier; see comment schemas & comment_service.
    __table_args__ = (
        CheckConstraint(
            "(length(trim(content)) > 0) OR media_urls IS NOT NULL OR gif_url IS NOT NULL",
            name="comments_content_not_empty",
        ),
        CheckConstraint(
            "length(content) <= 10000",
            name="comments_max_content_length",
        ),
    )


