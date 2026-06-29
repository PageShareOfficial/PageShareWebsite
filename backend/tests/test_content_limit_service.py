"""Tests for post/comment content length limits."""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.services.content_limit_service import (
    FREE_CONTENT_MAX_LENGTH,
    PREMIUM_CONTENT_MAX_LENGTH,
    ContentLengthExceeded,
    assert_content_length_allowed,
    get_max_content_length,
)


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def user_id():
    return uuid4()


@patch("app.services.content_limit_service.is_premium_user", return_value=False)
def test_free_user_max_length(mock_premium, db, user_id):
    assert get_max_content_length(db, user_id) == FREE_CONTENT_MAX_LENGTH
    assert_content_length_allowed(db, user_id, "x" * FREE_CONTENT_MAX_LENGTH)
    with pytest.raises(ContentLengthExceeded) as exc:
        assert_content_length_allowed(db, user_id, "x" * (FREE_CONTENT_MAX_LENGTH + 1))
    assert exc.value.max_length == FREE_CONTENT_MAX_LENGTH


@patch("app.services.content_limit_service.is_premium_user", return_value=True)
def test_premium_user_max_length(mock_premium, db, user_id):
    assert get_max_content_length(db, user_id) == PREMIUM_CONTENT_MAX_LENGTH
    assert_content_length_allowed(db, user_id, "x" * PREMIUM_CONTENT_MAX_LENGTH)
    with pytest.raises(ContentLengthExceeded) as exc:
        assert_content_length_allowed(db, user_id, "x" * (PREMIUM_CONTENT_MAX_LENGTH + 1))
    assert exc.value.max_length == PREMIUM_CONTENT_MAX_LENGTH
