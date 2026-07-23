"""Lazy settle due predictions when analyst loads list or detail."""

from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.services.coinbase_market_service import (
    CoinbaseUnavailableError,
    UnsupportedAssetError,
)
from app.services.prediction_constants import (
    PREDICTION_STATUS_ACTIVE,
    SETTLE_DUE_PER_REQUEST,
)
from app.services.prediction_evaluate_engine import (
    EvaluationError,
    apply_evaluation_to_prediction,
    evaluate_prediction_market,
)

logger = logging.getLogger("pageshare.prediction_settle")

@dataclass(frozen=True)
class SettleDueResult:
    attempted: int
    settled: int
    failed: int

def fetch_due_predictions(
    db: Session,
    user_id: UUID,
    *,
    limit: int = SETTLE_DUE_PER_REQUEST,
) -> list[Prediction]:
    """Active, unresolved predictions past expiry (asset-grouped, oldest first)."""
    now = datetime.now(timezone.utc)
    return (
        db.query(Prediction)
        .filter(
            Prediction.user_id == user_id,
            Prediction.status == PREDICTION_STATUS_ACTIVE,
            Prediction.outcome.is_(None),
            Prediction.expiry_at <= now,
        )
        .order_by(Prediction.asset.asc(), Prediction.expiry_at.asc())
        .limit(limit)
        .all()
    )

def settle_due_predictions_for_user(
    db: Session,
    user_id: UUID,
    *,
    limit: int = SETTLE_DUE_PER_REQUEST,
) -> SettleDueResult:
    """Evaluate up to ``limit`` due rows; failed rows stay active (partial OK)."""
    due_rows = fetch_due_predictions(db, user_id, limit=limit)
    settled = 0
    failed = 0

    for prediction in due_rows:
        if _try_settle_prediction(db, prediction):
            settled += 1
        else:
            failed += 1

    return SettleDueResult(
        attempted=len(due_rows),
        settled=settled,
        failed=failed,
    )

def _try_settle_prediction(db: Session, prediction: Prediction) -> bool:
    """Return True when row is resolved (including already settled)."""
    if prediction.outcome is not None or prediction.status != PREDICTION_STATUS_ACTIVE:
        return True

    try:
        result, _timings = evaluate_prediction_market(
            asset=prediction.asset,
            position=prediction.position,
            entry=float(prediction.entry_price),
            target=float(prediction.target_price),
            stop=float(prediction.stop_loss),
            start_time=prediction.start_time,
            expiry_at=prediction.expiry_at,
        )
    except (CoinbaseUnavailableError, UnsupportedAssetError, EvaluationError) as exc:
        logger.warning(
            "Prediction settle skipped id=%s asset=%s: %s",
            prediction.id,
            prediction.asset,
            exc,
        )
        return False

    if not apply_evaluation_to_prediction(prediction, result):
        return True

    db.commit()
    db.refresh(prediction)
    return True
