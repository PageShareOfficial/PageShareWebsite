"""Tests for prediction submission quota helpers."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4
from app.models.user import User
from app.services.prediction_service import count_predictions_submitted_today

def test_count_predictions_submitted_today_uses_local_day_bounds():
    user_id = uuid4()
    user = MagicMock()
    user.timezone = "UTC"
    db = MagicMock()
    db.get.return_value = user
    query = db.query.return_value
    filtered = query.filter.return_value
    filtered.scalar.return_value = 1

    count = count_predictions_submitted_today(
        db, user_id, client_timezone="Asia/Kolkata"
    )

    assert count == 1
    db.get.assert_called_once_with(User, user_id)
    query.filter.assert_called_once()
    filter_args = query.filter.call_args[0]
    start_utc = filter_args[1].right.value
    end_utc = filter_args[2].right.value
    assert start_utc.tzinfo == timezone.utc
    assert end_utc.tzinfo == timezone.utc
    assert end_utc > start_utc
