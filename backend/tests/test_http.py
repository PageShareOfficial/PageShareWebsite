"""Unit tests for app.utils.http."""
import pytest
from fastapi import HTTPException

from app.utils.http import parse_uuid_or_404


def test_parse_uuid_or_404_valid_returns_uuid():
    """Valid UUID string returns UUID instance."""
    result = parse_uuid_or_404("550e8400-e29b-41d4-a716-446655440000")
    assert str(result) == "550e8400-e29b-41d4-a716-446655440000"


def test_parse_uuid_or_404_invalid_raises_404():
    """Invalid string raises HTTPException 404 with default detail."""
    with pytest.raises(HTTPException) as exc_info:
        parse_uuid_or_404("not-a-uuid")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Not found"


def test_parse_uuid_or_404_custom_detail():
    """Invalid string raises 404 with custom detail."""
    with pytest.raises(HTTPException) as exc_info:
        parse_uuid_or_404("bad", detail="Post not found")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Post not found"


def test_parse_uuid_or_404_empty_string_raises():
    """Empty string raises 404."""
    with pytest.raises(HTTPException) as exc_info:
        parse_uuid_or_404("")
    assert exc_info.value.status_code == 404
