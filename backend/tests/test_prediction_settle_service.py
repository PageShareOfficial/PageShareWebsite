"""Tests for settling due predictions in scheduled batches."""

from datetime import datetime, timedelta, timezone
from itertools import count
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.coinbase_market_service import CoinbaseUnavailableError
from app.services.prediction_constants import (
    OUTCOME_WIN,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_STATUS_COMPLETED,
    SETTLE_DUE_PER_RUN,
)
from app.services.prediction_evaluate_engine import EvaluationError, EvaluationResult
from app.services.prediction_settle_service import (
    fetch_due_predictions_queue,
    settle_due_predictions,
)

UTC = timezone.utc
EVALUATE_PATH = "app.services.prediction_settle_service.evaluate_prediction_market"
APPLY_PATH = "app.services.prediction_settle_service.apply_evaluation_to_prediction"

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
    prediction.settle_attempted_at = None
    return prediction

def _win_result() -> EvaluationResult:
    return EvaluationResult(
        outcome=OUTCOME_WIN,
        return_pct=0.1,
        hit_price=110.0,
        hit_at=datetime.now(UTC),
        status=PREDICTION_STATUS_COMPLETED,
    )

def _mock_due_query(db: MagicMock, rows: list[MagicMock]) -> MagicMock:
    query = MagicMock()
    db.query.return_value = query
    query.filter.return_value = query
    query.order_by.return_value = query
    query.limit.return_value = query
    query.all.return_value = rows
    return query

def test_fetch_due_predictions_queue_spans_all_users():
    db = MagicMock()
    query = _mock_due_query(db, [])

    fetch_due_predictions_queue(db, limit=7)

    query.filter.assert_called_once()
    order_columns = [str(arg) for arg in query.order_by.call_args.args]
    assert "settle_attempted_at ASC NULLS FIRST" in order_columns[0]
    assert "expiry_at ASC" in order_columns[1]
    query.limit.assert_called_once_with(7)

@pytest.mark.parametrize("limit", [0, -5])
def test_fetch_due_predictions_queue_rejects_non_positive_limit(limit):
    with pytest.raises(ValueError):
        fetch_due_predictions_queue(MagicMock(), limit=limit)


def test_settle_due_predictions_persists_success():
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])
    eval_result = _win_result()

    with (
        patch(EVALUATE_PATH, return_value=(eval_result, MagicMock())) as mock_evaluate,
        patch(APPLY_PATH, return_value=True) as mock_apply,
    ):
        result = settle_due_predictions(db)

    mock_evaluate.assert_called_once()
    mock_apply.assert_called_once_with(prediction, eval_result)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(prediction)
    assert prediction.settle_attempted_at is not None
    assert result.attempted == 1
    assert result.settled == 1
    assert result.failed == 0

def test_settle_records_attempt_when_coinbase_unavailable():
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])

    with patch(EVALUATE_PATH, side_effect=CoinbaseUnavailableError("down")):
        result = settle_due_predictions(db)

    db.commit.assert_called_once()
    db.refresh.assert_not_called()
    assert prediction.settle_attempted_at is not None
    assert prediction.outcome is None
    assert result.attempted == 1
    assert result.settled == 0
    assert result.failed == 1

def test_settle_records_attempt_on_evaluation_error():
    db = MagicMock()
    prediction = _due_prediction()
    _mock_due_query(db, [prediction])

    with patch(EVALUATE_PATH, side_effect=EvaluationError("No candles")):
        result = settle_due_predictions(db)

    assert prediction.settle_attempted_at is not None
    assert result.failed == 1

def test_settle_skips_already_resolved_row():
    db = MagicMock()
    prediction = _due_prediction()
    prediction.outcome = OUTCOME_WIN
    _mock_due_query(db, [prediction])

    with patch(EVALUATE_PATH) as mock_evaluate:
        result = settle_due_predictions(db)

    mock_evaluate.assert_not_called()
    db.commit.assert_not_called()
    assert result.settled == 1
    assert result.failed == 0

def test_scheduled_settle_shares_one_client_across_rows():
    db = MagicMock()
    rows = [_due_prediction() for _ in range(3)]
    query = _mock_due_query(db, rows)

    with (
        patch(EVALUATE_PATH, return_value=(_win_result(), MagicMock())) as mock_evaluate,
        patch(APPLY_PATH, return_value=True),
    ):
        result = settle_due_predictions(db)

    query.limit.assert_called_once_with(SETTLE_DUE_PER_RUN)
    clients = {id(call.kwargs["client"]) for call in mock_evaluate.call_args_list}
    assert len(clients) == 1
    assert mock_evaluate.call_args_list[0].kwargs["client"] is not None
    assert result.attempted == 3
    assert result.settled == 3

def test_scheduled_settle_mixed_success_and_failure():
    db = MagicMock()
    rows = [_due_prediction() for _ in range(3)]
    _mock_due_query(db, rows)
    outcomes = [
        (_win_result(), MagicMock()),
        CoinbaseUnavailableError("down"),
        (_win_result(), MagicMock()),
    ]

    with (
        patch(EVALUATE_PATH, side_effect=outcomes),
        patch(APPLY_PATH, return_value=True),
    ):
        result = settle_due_predictions(db, limit=3)

    assert result.attempted == 3
    assert result.settled == 2
    assert result.failed == 1
    assert all(row.settle_attempted_at is not None for row in rows)

def test_scheduled_settle_stops_when_time_budget_runs_out():
    db = MagicMock()
    rows = [_due_prediction() for _ in range(5)]
    _mock_due_query(db, rows)
    ticks = count(start=0, step=10)

    with (
        patch(EVALUATE_PATH, return_value=(_win_result(), MagicMock())) as mock_evaluate,
        patch(APPLY_PATH, return_value=True),
    ):
        result = settle_due_predictions(
            db, limit=5, time_budget_seconds=25, clock=lambda: next(ticks)
        )

    # Deadline is 25s; checks happen at 10s and 20s, then 30s stops the batch.
    assert mock_evaluate.call_count == 2
    assert result.attempted == 2
    assert result.settled == 2

@pytest.mark.parametrize(
    ("limit", "budget"),
    [(0, 25.0), (-1, 25.0), (5, 0), (5, -3.0)],
)
def test_scheduled_settle_rejects_invalid_arguments(limit, budget):
    with pytest.raises(ValueError):
        settle_due_predictions(MagicMock(), limit=limit, time_budget_seconds=budget)
