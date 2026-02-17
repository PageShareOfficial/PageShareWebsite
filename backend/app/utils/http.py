"""
HTTP helpers for API layer. Reduces duplicated validation and error handling.
"""
from uuid import UUID

from fastapi import HTTPException, status


def parse_uuid_or_404(value: str, detail: str = "Not found") -> UUID:
    """
    Parse a string as UUID or raise 404. Use for path/query params to avoid
    repeated try/except ValueError across endpoints.
    """
    try:
        return UUID(value)
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
