from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class Prediction(Base):
    __tablename__ = "predictions"

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
        index=True,
    )
    asset = Column(String(32), nullable=False)
    asset_name = Column(String(120))
    prediction_type = Column(String(20), nullable=False, server_default="target")
    position = Column(String(10), nullable=False)
    entry_price = Column(Numeric(24, 8), nullable=False)
    target_price = Column(Numeric(24, 8), nullable=False)
    stop_loss = Column(Numeric(24, 8), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    expiry_at = Column(DateTime(timezone=True), nullable=False)
    lock_started_at = Column(DateTime(timezone=True), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=False)
    thesis = Column(Text, nullable=False)
    thesis_image_url = Column(Text)
    status = Column(String(20), nullable=False, server_default="active")
    # Evaluate / settle fields (null until resolved once)
    outcome = Column(String(20), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    hit_price = Column(Numeric(24, 8), nullable=True)
    hit_at = Column(DateTime(timezone=True), nullable=True)
    return_pct = Column(Numeric(18, 8), nullable=True)
    resolution_source = Column(String(40), nullable=True)
    resolution_note = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True)
    anchor_status = Column(String(20), nullable=False, server_default="none")
    chain_tx_hash = Column(String(66), nullable=True)
    chain_id = Column(Integer, nullable=True)
    anchored_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "position IN ('long', 'short')",
            name="predictions_position_check",
        ),
        CheckConstraint(
            "status IN ('active', 'completed', 'expired', 'invalid')",
            name="predictions_status_check",
        ),
        CheckConstraint(
            "outcome IS NULL OR outcome IN ('win', 'loss', 'expired')",
            name="predictions_outcome_check",
        ),
        CheckConstraint(
            "anchor_status IN ('none', 'pending', 'submitted', 'confirmed', 'failed')",
            name="predictions_anchor_status_check",
        ),
        CheckConstraint(
            f"char_length(thesis) <= {300}",
            name="predictions_thesis_max_length",
        ),
        Index(
            "ix_predictions_user_status_expiry",
            "user_id",
            "status",
            "expiry_at",
        ),
    )
