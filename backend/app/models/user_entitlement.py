"""User subscription entitlement mirror (updated via Stripe webhooks)."""

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID

from . import Base


class UserEntitlement(Base):
    __tablename__ = "user_entitlements"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    stripe_customer_id = Column(String(255), nullable=True, unique=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    plan_id = Column(String(20), nullable=True)
    interval = Column(String(20), nullable=True)
    status = Column(String(32), nullable=False, server_default="none")
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    past_due_grace_ends_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
