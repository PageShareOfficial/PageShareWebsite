"""Tests for user bootstrap on first login (get_or_create_user_for_auth)."""

from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.services.auth_service import CurrentUser
from app.services.user_service import DISPLAY_NAME_MAX_LENGTH, get_or_create_user_for_auth

def _current_user(**claims) -> CurrentUser:
    return CurrentUser(auth_user_id=str(uuid4()), claims=claims)

def _integrity_error() -> IntegrityError:
    return IntegrityError("INSERT INTO users", {}, Exception("duplicate key"))

def test_returns_existing_user_without_insert():
    db = MagicMock()
    existing = User(id=uuid4(), username="alice", display_name="Alice")
    db.get.return_value = existing

    assert get_or_create_user_for_auth(db, _current_user()) is existing
    db.add.assert_not_called()

def test_creates_placeholder_user_needing_onboarding():
    db = MagicMock()
    db.get.return_value = None
    current = _current_user(name="Alice Doe", email="alice@example.com")

    user = get_or_create_user_for_auth(db, current)

    assert user.username == f"user_{current.auth_user_id.replace('-', '')[:24]}"
    assert user.display_name == "Alice Doe"
    db.commit.assert_called_once()

def test_falls_back_to_email_then_default_display_name():
    db = MagicMock()
    db.get.return_value = None

    assert get_or_create_user_for_auth(db, _current_user(email="a@b.co")).display_name == "a@b.co"
    assert get_or_create_user_for_auth(db, _current_user()).display_name == "New User"

def test_truncates_long_display_name_to_column_limit():
    db = MagicMock()
    db.get.return_value = None

    user = get_or_create_user_for_auth(db, _current_user(name="x" * 250))

    assert len(user.display_name) == DISPLAY_NAME_MAX_LENGTH

def test_returns_row_created_by_concurrent_request():
    db = MagicMock()
    winner = User(id=uuid4(), username="user_abc", display_name="Alice")
    db.get.side_effect = [None, winner]
    db.commit.side_effect = _integrity_error()

    assert get_or_create_user_for_auth(db, _current_user()) is winner
    db.rollback.assert_called_once()

def test_reraises_integrity_error_when_no_row_exists():
    db = MagicMock()
    db.get.side_effect = [None, None]
    db.commit.side_effect = _integrity_error()

    with pytest.raises(IntegrityError):
        get_or_create_user_for_auth(db, _current_user())
    db.rollback.assert_called_once()
