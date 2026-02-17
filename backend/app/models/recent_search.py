from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base


class RecentSearch(Base):
    """User's recent search entries (accounts and tickers). Backend source of truth."""

    __tablename__ = "recent_searches"

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
    type = Column(String(20), nullable=False)  # 'account' | 'ticker'
    result_id = Column(String(255), nullable=False)  # username or ticker symbol
    query = Column(String(255), nullable=False)
    result_display_name = Column(String(255))
    result_image_url = Column(String(2048))
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
