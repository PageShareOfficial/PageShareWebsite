from sqlalchemy import (
    ARRAY,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from . import Base


class Poll(Base):
    __tablename__ = "polls"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
    )
    comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )
    options = Column(ARRAY(Text), nullable=False)
    duration_days = Column(Integer, nullable=False, server_default="1")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "(post_id IS NOT NULL AND comment_id IS NULL) "
            "OR (post_id IS NULL AND comment_id IS NOT NULL)",
            name="poll_target",
        ),
        CheckConstraint(
            "array_length(options, 1) >= 2",
            name="min_options",
        ),
        CheckConstraint(
            "array_length(options, 1) <= 4",
            name="max_options",
        ),
        CheckConstraint(
            "duration_days > 0 AND duration_days <= 7",
            name="min_duration",
        ),
    )


