"""Analytics predictions tab: index list and single-prediction detail with lazy settle."""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.user import User
from app.services.prediction_constants import PREDICTION_STATUS_INVALID
from app.services.prediction_service import AnalystRequiredError, is_analyst_user
from app.services.prediction_settle_service import settle_prediction_if_due
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    assert_analyst_target,
    assert_investor_user,
)
from app.services.user_service import get_user_by_username

@dataclass(frozen=True)
class PredictionIndexItem:
    id: UUID
    number: int
    asset: str
    status: str
    outcome: Optional[str]
    created_at: datetime

def _indexed_predictions(db: Session, analyst_id: UUID) -> list[Prediction]:
    return (
        db.query(Prediction)
        .filter(
            Prediction.user_id == analyst_id,
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .order_by(Prediction.created_at.asc())
        .all()
    )

def _number_map(rows: list[Prediction]) -> dict[UUID, int]:
    return {row.id: index + 1 for index, row in enumerate(rows)}

def list_prediction_index(db: Session, analyst_id: UUID) -> list[PredictionIndexItem]:
    """Newest-first index; prediction numbers are chronological (oldest = 1)."""
    rows = _indexed_predictions(db, analyst_id)
    numbers = _number_map(rows)
    return [
        PredictionIndexItem(
            id=row.id,
            number=numbers[row.id],
            asset=row.asset,
            status=row.status,
            outcome=row.outcome,
            created_at=row.created_at,
        )
        for row in reversed(rows)
    ]

def get_prediction_for_index(
    db: Session,
    analyst_id: UUID,
    prediction_id: UUID,
    *,
    settle_if_due: bool = True,
) -> tuple[int, Prediction]:
    rows = _indexed_predictions(db, analyst_id)
    numbers = _number_map(rows)
    prediction = next((row for row in rows if row.id == prediction_id), None)
    if prediction is None:
        raise LookupError("Prediction not found")

    if settle_if_due:
        settle_prediction_if_due(db, prediction)
        db.refresh(prediction)

    return numbers[prediction.id], prediction

def list_own_prediction_index(db: Session, viewer_id: UUID) -> list[PredictionIndexItem]:
    if not is_analyst_user(db, viewer_id):
        raise AnalystRequiredError(
            "Analyst subscription required to view your predictions."
        )
    return list_prediction_index(db, viewer_id)

def list_analyst_prediction_index_for_investor(
    db: Session, investor_id: UUID, username: str
) -> tuple[User, list[PredictionIndexItem]]:
    assert_investor_user(db, investor_id)
    analyst = get_user_by_username(db, username)
    if analyst is None:
        raise LookupError("Analyst not found")
    assert_analyst_target(db, analyst.id)
    return analyst, list_prediction_index(db, analyst.id)

def get_own_prediction_detail(
    db: Session, viewer_id: UUID, prediction_id: UUID
) -> tuple[int, Prediction]:
    if not is_analyst_user(db, viewer_id):
        raise AnalystRequiredError(
            "Analyst subscription required to view your predictions."
        )
    return get_prediction_for_index(db, viewer_id, prediction_id)

def get_analyst_prediction_detail_for_investor(
    db: Session, investor_id: UUID, username: str, prediction_id: UUID
) -> tuple[User, int, Prediction]:
    assert_investor_user(db, investor_id)
    analyst = get_user_by_username(db, username)
    if analyst is None:
        raise LookupError("Analyst not found")
    assert_analyst_target(db, analyst.id)
    number, prediction = get_prediction_for_index(
        db, analyst.id, prediction_id, settle_if_due=False
    )
    return analyst, number, prediction
