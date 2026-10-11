"""Tests for the scheduled prediction settle cron endpoint."""

from contextlib import contextmanager
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from app.api.cron import cron_settle_predictions
from app.services.prediction_settle_service import SettleDueResult

CRON_SECRET = "test-cron-secret"

@contextmanager
def _fake_db_session():
    yield MagicMock()

@pytest.fixture
def cron_settings():
    with patch("app.api.cron.settings", MagicMock(cron_secret=CRON_SECRET)):
        yield

def test_settle_cron_rejects_missing_secret(cron_settings):
    with pytest.raises(HTTPException) as exc_info:
        cron_settle_predictions(authorization=None, x_cron_secret=None)
    assert exc_info.value.status_code == 403

def test_settle_cron_rejects_wrong_secret(cron_settings):
    with pytest.raises(HTTPException) as exc_info:
        cron_settle_predictions(authorization="Bearer nope", x_cron_secret=None)
    assert exc_info.value.status_code == 403

def test_settle_cron_returns_counts(cron_settings):
    with (
        patch("app.api.cron.db_session", _fake_db_session),
        patch(
            "app.api.cron.settle_due_predictions",
            return_value=SettleDueResult(attempted=4, settled=3, failed=1),
        ) as mock_settle,
    ):
        body = cron_settle_predictions(authorization=None, x_cron_secret=CRON_SECRET)

    mock_settle.assert_called_once()
    assert body["ok"] is True
    assert body["attempted"] == 4
    assert body["settled"] == 3
    assert body["failed"] == 1
    assert body["elapsed_ms"] >= 0

def test_settle_cron_reports_unexpected_failure(cron_settings):
    with (
        patch("app.api.cron.db_session", _fake_db_session),
        patch(
            "app.api.cron.settle_due_predictions",
            side_effect=RuntimeError("database unavailable"),
        ),
    ):
        body = cron_settle_predictions(
            authorization=f"Bearer {CRON_SECRET}", x_cron_secret=None
        )

    assert body == {"ok": False, "error": "database unavailable"}
