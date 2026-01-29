from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from . import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    session_start = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    session_end = Column(DateTime(timezone=True))
    ip_address_hash = Column(String(64))
    user_agent = Column(String)
    country_code = Column(String(2))
    actions_count = Column(Integer, server_default="0")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
