"""Tests for saved analyst service."""

from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    InvestorRequiredError,
    add_saved_analyst,
    assert_analyst_target,
    assert_investor_user,
    remove_saved_analyst,
)

def test_assert_investor_user_rejects_non_investor():
    db = MagicMock()
    with patch(
        "app.services.saved_analyst_service.get_user_plan_id",
        return_value="analyst",
    ):
        with pytest.raises(InvestorRequiredError):
            assert_investor_user(db, uuid4())

def test_assert_analyst_target_requires_analyst_plan():
    db = MagicMock()
    with patch(
        "app.services.saved_analyst_service.get_user_plan_id",
        return_value="investor",
    ):
        with pytest.raises(AnalystTargetRequiredError):
            assert_analyst_target(db, uuid4())

def test_add_saved_analyst_rejects_self():
    db = MagicMock()
    user_id = uuid4()
    with pytest.raises(ValueError, match="yourself"):
        add_saved_analyst(db, user_id, user_id)

def test_remove_saved_analyst_returns_false_when_missing():
    db = MagicMock()
    query = db.query.return_value
    query.filter.return_value.first.return_value = None
    assert remove_saved_analyst(db, uuid4(), uuid4()) is False
