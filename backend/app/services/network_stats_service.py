"""Public platform stats for the app shell (right rail)."""

from sqlalchemy import distinct, func
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.saved_analyst import SavedAnalyst
from app.services.prediction_constants import PREDICTION_STATUS_INVALID

def get_network_stats(db: Session) -> dict[str, int]:
    """Counts for analyst supply and investor saved-analyst demand."""
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    verified_predictions = (
        db.query(func.count(Prediction.id))
        .filter(
            Prediction.outcome.isnot(None),
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .scalar()
        or 0
    )
    publishing_analysts = (
        db.query(func.count(distinct(Prediction.user_id))).scalar() or 0
    )
    saved_analysts = (
        db.query(func.count(distinct(SavedAnalyst.analyst_id))).scalar() or 0
    )
    saving_investors = (
        db.query(func.count(distinct(SavedAnalyst.investor_id))).scalar() or 0
    )
    return {
        "total_predictions": int(total_predictions),
        "verified_predictions": int(verified_predictions),
        "publishing_analysts": int(publishing_analysts),
        "saved_analysts": int(saved_analysts),
        "saving_investors": int(saving_investors),
    }
