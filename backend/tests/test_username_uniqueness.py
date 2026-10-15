"""Username uniqueness during onboarding: clean 409 instead of 401 or 500."""

from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from app.api.users import router
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import OnboardingRequest
from app.services.auth_service import CurrentUser
from app.services.user_service import (
    USERNAME_TAKEN_MESSAGE,
    UsernameTakenError,
    apply_onboarding,
)

def _other_user() -> User:
    return User(id=uuid4(), username="alice", display_name="Alice")

def _db_for(user: User, *lookups) -> MagicMock:
    """DB mock whose username lookups return `lookups` in order (None = available)."""
    db = MagicMock()
    db.get.return_value = user
    db.execute.return_value.scalars.return_value.first.side_effect = list(lookups)
    return db

def _onboard(db: MagicMock, user: User):
    current = CurrentUser(auth_user_id=str(user.id), claims={})
    payload = OnboardingRequest(username="alice", display_name="Alice")
    return apply_onboarding(db, current, payload, country=None, country_code=None, ip_hash=None)

def _new_user() -> User:
    return User(id=uuid4(), username="user_abc", display_name="New User")

def _integrity_error() -> IntegrityError:
    return IntegrityError("UPDATE users", {}, Exception("duplicate key"))

def test_taken_username_is_rejected_before_saving():
    user = _new_user()
    db = _db_for(user, _other_user())

    with pytest.raises(UsernameTakenError):
        _onboard(db, user)
    db.commit.assert_not_called()

def test_username_claimed_during_commit_becomes_username_taken():
    user = _new_user()
    db = _db_for(user, None, _other_user())
    db.commit.side_effect = _integrity_error()

    with pytest.raises(UsernameTakenError):
        _onboard(db, user)
    db.rollback.assert_called_once()

def test_unrelated_integrity_error_is_not_reported_as_username_taken():
    user = _new_user()
    db = _db_for(user, None, None)
    db.commit.side_effect = _integrity_error()

    with pytest.raises(IntegrityError):
        _onboard(db, user)

def test_onboarding_endpoint_returns_409_for_taken_username():
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        auth_user_id=str(uuid4()), claims={}
    )
    client = TestClient(app)

    with (
        patch("app.api.users.extract_client_ip", return_value=None),
        patch("app.api.users.apply_onboarding", side_effect=UsernameTakenError()),
    ):
        response = client.post(
            "/api/v1/users/me/onboarding", json={"username": "alice", "display_name": "Alice"}
        )

    assert response.status_code == 409
    assert response.json()["detail"] == USERNAME_TAKEN_MESSAGE
