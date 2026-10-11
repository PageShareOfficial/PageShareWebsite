"""Settle due predictions: one at a time on detail view, and in scheduled batches."""

from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter
from typing import Callable, Optional
import httpx
from sqlalchemy.orm import Query, Session
from app.models.prediction import Prediction
from app.services.coinbase_market_service import (
    CoinbaseUnavailableError,
    UnsupportedAssetError,
    create_market_http_client,
)
from app.services.prediction_constants import (
    PREDICTION_STATUS_ACTIVE,
    SETTLE_DUE_PER_RUN,
    SETTLE_RUN_TIME_BUDGET_SECONDS,
)
from app.services.prediction_evaluate_engine import (
    EvaluationError,
    EvaluationResult,
    apply_evaluation_to_prediction,
    evaluate_prediction_market,
)

logger = logging.getLogger("pageshare.prediction_settle")

@dataclass(frozen=True)
class SettleDueResult:
    attempted: int
    settled: int
    failed: int

def _due_predictions_query(db: Session, now: datetime) -> Query:
    """Active, unresolved predictions whose expiry has passed."""
    return db.query(Prediction).filter(
        Prediction.status == PREDICTION_STATUS_ACTIVE,
        Prediction.outcome.is_(None),
        Prediction.expiry_at <= now,
    )

def fetch_due_predictions_queue(
    db: Session,
    *,
    limit: int = SETTLE_DUE_PER_RUN,
) -> list[Prediction]:
    """All users' due predictions: never-attempted first, then least recently attempted."""
    if limit < 1:
        raise ValueError("limit must be positive")
    now = datetime.now(timezone.utc)
    return (
        _due_predictions_query(db, now)
        .order_by(
            Prediction.settle_attempted_at.asc().nulls_first(),
            Prediction.expiry_at.asc(),
        )
        .limit(limit)
        .all()
    )

def settle_prediction_if_due(db: Session, prediction: Prediction) -> bool:
    """Evaluate a single row when active and past expiry; no-op otherwise."""
    if _is_resolved(prediction):
        return True

    now = datetime.now(timezone.utc)
    expiry = prediction.expiry_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry > now:
        return True

    return _try_settle_prediction(db, prediction)

def settle_due_predictions(
    db: Session,
    *,
    limit: int = SETTLE_DUE_PER_RUN,
    time_budget_seconds: float = SETTLE_RUN_TIME_BUDGET_SECONDS,
    clock: Callable[[], float] = perf_counter,
) -> SettleDueResult:
    """Scheduled batch across all users; stops at ``limit`` rows or when the budget runs out."""
    if limit < 1 or time_budget_seconds <= 0:
        raise ValueError("limit and time_budget_seconds must be positive")

    due_rows = fetch_due_predictions_queue(db, limit=limit)
    deadline = clock() + time_budget_seconds
    with create_market_http_client() as client:
        return _settle_rows(
            db,
            due_rows,
            client=client,
            should_stop=lambda: clock() >= deadline,
        )

def _settle_rows(
    db: Session,
    rows: list[Prediction],
    *,
    client: Optional[httpx.Client] = None,
    should_stop: Callable[[], bool] = lambda: False,
) -> SettleDueResult:
    attempted = 0
    settled = 0
    for prediction in rows:
        if should_stop():
            break
        attempted += 1
        if _try_settle_prediction(db, prediction, client=client):
            settled += 1

    return SettleDueResult(
        attempted=attempted,
        settled=settled,
        failed=attempted - settled,
    )

def _try_settle_prediction(
    db: Session,
    prediction: Prediction,
    *,
    client: Optional[httpx.Client] = None,
) -> bool:
    """Return True when row is resolved (including already settled)."""
    if _is_resolved(prediction):
        return True

    prediction.settle_attempted_at = datetime.now(timezone.utc)
    try:
        result = _evaluate_market(prediction, client)
    except (CoinbaseUnavailableError, UnsupportedAssetError, EvaluationError) as exc:
        logger.warning(
            "Prediction settle skipped id=%s asset=%s: %s",
            prediction.id,
            prediction.asset,
            exc,
        )
        db.commit()
        return False

    apply_evaluation_to_prediction(prediction, result)
    db.commit()
    db.refresh(prediction)
    return True

def _is_resolved(prediction: Prediction) -> bool:
    return prediction.outcome is not None or prediction.status != PREDICTION_STATUS_ACTIVE

def _evaluate_market(
    prediction: Prediction, client: Optional[httpx.Client]
) -> EvaluationResult:
    result, _timings = evaluate_prediction_market(
        asset=prediction.asset,
        position=prediction.position,
        entry=float(prediction.entry_price),
        target=float(prediction.target_price),
        stop=float(prediction.stop_loss),
        start_time=prediction.start_time,
        expiry_at=prediction.expiry_at,
        client=client,
    )
    return result
