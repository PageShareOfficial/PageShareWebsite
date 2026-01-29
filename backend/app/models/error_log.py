from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from . import Base

class ErrorLog(Base):
    __tablename__ = "error_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    error_type = Column(String(50), nullable=False)
    error_code = Column(String(50))
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text)
    user_id = Column(UUID(as_uuid=True))
    request_path = Column(Text)
    request_method = Column(String(10))
    request_id = Column(String(100))
    user_agent = Column(Text)
    ip_address_hash = Column(String(64))
    environment = Column(String(20), nullable=False)
    severity = Column(
        String(20),
        nullable=False,
        server_default="error",
    )
    resolved = Column(Boolean, server_default="false", nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(UUID(as_uuid=True))
    extra_metadata = Column("metadata", JSONB)  # DB column "metadata"; name reserved in Declarative
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
