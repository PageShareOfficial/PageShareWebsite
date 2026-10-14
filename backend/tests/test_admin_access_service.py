"""Tests for admin role checks and admin bypass of premium gates."""

from unittest.mock import MagicMock, patch
from uuid import uuid4
from app.models.user import User
from app.services.admin_access_service import ADMIN_BADGE, is_admin, is_admin_user_id
from app.services.billing_constants import PLAN_ID_ANALYST, PLAN_ID_INVESTOR
from app.services.prediction_leaderboard_service import resolve_leaderboard_viewer_plan_id
from app.services.prediction_service import is_analyst_user
from app.services.saved_analyst_service import is_investor_user
from app.services.subscription_service import is_premium_user

def _db_with_badge(badge):
    db = MagicMock()
    db.get.return_value = User(id=uuid4(), username="someone", display_name="S", badge=badge)
    return db

def test_is_admin_only_for_admin_badge():
    assert is_admin(User(badge=ADMIN_BADGE)) is True
    assert is_admin(User(badge="Verified")) is False
    assert is_admin(User(badge=None)) is False
    assert is_admin(None) is False

def test_is_admin_user_id_handles_missing_user_and_id():
    db = MagicMock()
    db.get.return_value = None
    assert is_admin_user_id(db, uuid4()) is False
    assert is_admin_user_id(db, None) is False
    db.get.assert_called_once()

def test_admin_gets_every_premium_gate_without_subscription():
    db = _db_with_badge(ADMIN_BADGE)
    user_id = uuid4()
    with patch("app.services.prediction_service.get_user_plan_id", return_value=None), patch(
        "app.services.saved_analyst_service.get_user_plan_id", return_value=None
    ):
        assert is_premium_user(db, user_id) is True
        assert is_analyst_user(db, user_id) is True
        assert is_investor_user(db, user_id) is True

def test_non_admin_still_needs_matching_plan():
    db = _db_with_badge(None)
    user_id = uuid4()
    with patch(
        "app.services.prediction_service.get_user_plan_id", return_value=PLAN_ID_INVESTOR
    ), patch("app.services.saved_analyst_service.get_user_plan_id", return_value=PLAN_ID_ANALYST):
        assert is_analyst_user(db, user_id) is False
        assert is_investor_user(db, user_id) is False

def test_leaderboard_viewer_plan_for_admin_is_investor():
    assert resolve_leaderboard_viewer_plan_id(_db_with_badge(ADMIN_BADGE), uuid4()) == (
        PLAN_ID_INVESTOR
    )

def test_leaderboard_viewer_plan_for_regular_and_anonymous_users():
    with patch(
        "app.services.prediction_leaderboard_service.get_user_plan_id",
        return_value=PLAN_ID_ANALYST,
    ):
        assert resolve_leaderboard_viewer_plan_id(_db_with_badge(None), uuid4()) == (
            PLAN_ID_ANALYST
        )
    assert resolve_leaderboard_viewer_plan_id(MagicMock(), None) is None
