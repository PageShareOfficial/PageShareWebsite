from sqlalchemy import CheckConstraint, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class Ticker(Base):
    __tablename__ = "tickers"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    symbol = Column(String(20), unique=True, nullable=False)
    name = Column(String(200))
    type = Column(String(20))  # 'stock', 'crypto', 'etf', 'other'
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "symbol = UPPER(symbol)",
            name="symbol_uppercase",
        ),
        CheckConstraint(
            "type IN ('stock', 'crypto', 'etf', 'other') OR type IS NULL",
            name="tickers_type_check",
        ),
    )
