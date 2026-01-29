from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    reporter_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reported_post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="SET NULL"),
        nullable=True,
    )
    reported_comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="SET NULL"),
        nullable=True,
    )
    reported_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    report_type = Column(String(50), nullable=False)
    reason = Column(Text)
    status = Column(
        String(20),
        nullable=False,
        server_default="pending",
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "("
            "reported_post_id IS NOT NULL AND reported_comment_id IS NULL AND reported_user_id IS NULL"
            ") OR ("
            "reported_post_id IS NULL AND reported_comment_id IS NOT NULL AND reported_user_id IS NULL"
            ") OR ("
            "reported_post_id IS NULL AND reported_comment_id IS NULL AND reported_user_id IS NOT NULL"
            ")",
            name="report_target",
        ),
        CheckConstraint(
            "status IN ('pending', 'reviewed', 'resolved', 'dismissed')",
            name="reports_status_check",
        ),
    )
