"""Tests for lazy prediction settle on list/detail fetch."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.coinbase_market_service import CoinbaseUnavailableError
from app.services.prediction_constants import (
    OUTCOME_WIN,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_STATUS_COMPLETED,
    SETTLE_DUE_PER_REQUEST,
)
from app.services.prediction_evaluate_engine import EvaluationError, EvaluationResult
from app.services.prediction_settle_service import (
    fetch_due_predictions,
    settle_due_predictions_for_user,
)

UTC = timezone.utc

def _due_prediction() -> MagicMock:
    now = datetime.now(UTC)
    prediction = MagicMock()
    prediction.id = uuid4()
    prediction.outcome = None
    prediction.status = PREDICTION_STATUS_ACTIVE
    prediction.asset = "BTC"
    prediction.position = "long"
    prediction.entry_price = 100.0
    prediction.target_price = 110.0
    prediction.stop_loss = 90.0
    prediction.start_time = now - timedelta(hours=2)
    prediction.expiry_at = now - timedelta(minutes=5)
    return prediction

def _win_result() -> EvaluationResult:
    return EvaluationResult(
        outcome=OUTCOME_WIN,
        return_pct=0.1,
        hit_price=110.0,
        hit_at=datetime.now(UTC),
        status=PREDICTION_STATUS_COMPLETED,
    )

def _mock_due_query(db: MagicMock, rows: list[MagicMock]) -> None:
    query = MagicMock()
    db.query.return_value = query
    query.filter.return_value = query
    query.order_by.return_value = query
    query.limit.return_value = query
    query.all.return_value = rows

def test_fetch_due_predictions_orders_by_asset_then_expiry():
    user_id = uuid4()
    db = MagicMock()
    _mock_due_query(db, [])

    fetch_due_predictions(db, user_id, limit=3)

    query = db.query.return_value
    db.query.assert_called_once()
    query.filter.assert_called_once()
    query.order_by.assert_called_once()
    query.limit.assert_called_once_with(3)
    query.all.assert_called_once()

def test_settle_due_predictions_persists_success():
    user_id = uuid4()
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])
    eval_result = _win_result()

    with (
        patch(
            "app.services.prediction_settle_service.evaluate_prediction_market",
            return_value=(eval_result, MagicMock()),
        ) as mock_evaluate,
        patch(
            "app.services.prediction_settle_service.apply_evaluation_to_prediction",
            return_value=True,
        ) as mock_apply,
    ):
        result = settle_due_predictions_for_user(db, user_id)

    mock_evaluate.assert_called_once()
    mock_apply.assert_called_once_with(prediction, eval_result)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(prediction)
    assert result.attempted == 1
    assert result.settled == 1
    assert result.failed == 0

def test_settle_leaves_active_when_coinbase_unavailable():
    user_id = uuid4()
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])

    with patch(
        "app.services.prediction_settle_service.evaluate_prediction_market",
        side_effect=CoinbaseUnavailableError("down"),
    ):
        result = settle_due_predictions_for_user(db, user_id)

    db.commit.assert_not_called()
    assert result.attempted == 1
    assert result.settled == 0
    assert result.failed == 1

def test_settle_leaves_active_on_evaluation_error():
    user_id = uuid4()
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])

    with patch(
        "app.services.prediction_settle_service.evaluate_prediction_market",
        side_effect=EvaluationError("No candles"),
    ):
        result = settle_due_predictions_for_user(db, user_id)

    db.commit.assert_not_called()
    assert result.failed == 1

def test_settle_respects_limit():
    user_id = uuid4()
    db = MagicMock()
    rows = [_due_prediction() for _ in range(SETTLE_DUE_PER_REQUEST)]
    _mock_due_query(db, rows)

    with (
        patch(
            "app.services.prediction_settle_service.evaluate_prediction_market",
            side_effect=CoinbaseUnavailableError("down"),
        ),
        patch(
            "app.services.prediction_settle_service.apply_evaluation_to_prediction",
        ) as mock_apply,
    ):
        result = settle_due_predictions_for_user(db, user_id)

    mock_apply.assert_not_called()
    assert result.attempted == SETTLE_DUE_PER_REQUEST
    assert result.failed == SETTLE_DUE_PER_REQUEST

def test_settle_skips_already_resolved_row():
    user_id = uuid4()
    db = MagicMock()
    prediction = _due_prediction()
    prediction.outcome = OUTCOME_WIN
    _mock_due_query(db, [prediction])

    with patch(
        "app.services.prediction_settle_service.evaluate_prediction_market",
    ) as mock_evaluate:
        result = settle_due_predictions_for_user(db, user_id)

    mock_evaluate.assert_not_called()
    db.commit.assert_not_called()
    assert result.settled == 1
    assert result.failed == 0
