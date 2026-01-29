from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class Reaction(Base):
    """
    Likes/reactions on posts or comments. Each row = one user liking one target.
    - Post likes: post_id set, comment_id NULL.
    - Comment likes: comment_id set, post_id NULL.
    """
    __tablename__ = "reactions"

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
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "(post_id IS NOT NULL AND comment_id IS NULL) "
            "OR (post_id IS NULL AND comment_id IS NOT NULL)",
            name="reaction_target",
        ),
    )
