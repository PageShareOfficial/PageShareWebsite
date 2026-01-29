from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class ContentFilter(Base):
    __tablename__ = "content_filters"

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
    filtered_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    filter_type = Column(String(10), nullable=False)  # 'mute' or 'block'
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "filter_type IN ('mute', 'block')",
            name="content_filters_type_check",
        ),
        CheckConstraint(
            "user_id != filtered_user_id",
            name="no_self_filter",
        ),
    )
