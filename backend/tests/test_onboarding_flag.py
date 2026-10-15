"""Tests for the explicit onboarding flag (users.onboarded_at)."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
from app.api.users import _build_user_response
from app.models.user import User
from app.schemas.user import OnboardingRequest
from app.services.auth_service import CurrentUser
from app.services.user_service import apply_onboarding, is_onboarded

EARLIER = datetime(2026, 1, 1, tzinfo=timezone.utc)

def _placeholder_user(user_id: str) -> User:
    return User(id=user_id, username="user_abc123", display_name="New User")

def _onboard(user: User, username: str = "user_picked") -> User:
    db = MagicMock()
    db.execute.return_value.scalars.return_value.first.return_value = None
    db.get.return_value = user
    current = CurrentUser(auth_user_id=str(user.id), claims={})
    payload = OnboardingRequest(username=username, display_name="Alice")
    return apply_onboarding(db, current, payload, country=None, country_code=None, ip_hash=None)

def test_onboarding_sets_onboarded_at_even_for_user_prefixed_username():
    user = _onboard(_placeholder_user(str(uuid4())))

    assert user.username == "user_picked"
    assert is_onboarded(user) is True

def test_onboarding_again_keeps_the_original_timestamp():
    user = _placeholder_user(str(uuid4()))
    user.onboarded_at = EARLIER

    assert _onboard(user, username="alice").onboarded_at == EARLIER

def test_user_response_reports_onboarding_completed():
    user = _placeholder_user(str(uuid4()))
    user.created_at = user.updated_at = EARLIER
    db = MagicMock()

    with (
        patch("app.api.users.get_user_stats", return_value=(0, 0, 0)),
        patch("app.api.users.get_user_interests", return_value=[]),
        patch("app.api.users.get_user_plan_id", return_value=None),
    ):
        assert _build_user_response(db, user).onboarding_completed is False
        user.onboarded_at = EARLIER
        assert _build_user_response(db, user).onboarding_completed is True
