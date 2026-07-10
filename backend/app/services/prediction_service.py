from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.user import User
from app.utils.timezone_utils import local_day_bounds_utc, resolve_timezone_name
from app.services.prediction_constants import (
    MAX_PREDICTIONS_PER_DAY,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_TYPE_TARGET,
)
from app.services.prediction_validation_service import (
    PredictionValidationError,
    validate_submission_payload,
)
from app.services.subscription_service import get_user_plan_id

class AnalystRequiredError(Exception):
    """User does not have an active analyst subscription."""

class DailyLimitExceededError(Exception):
    """User has reached the daily prediction submission cap."""

def is_analyst_user(db: Session, user_id: UUID) -> bool:
    return get_user_plan_id(db, user_id) == "analyst"

def count_predictions_submitted_today(
    db: Session,
    user_id: UUID,
    *,
    client_timezone: Optional[str] = None,
) -> int:
    """Count predictions submitted during the user's current local calendar day."""
    user = db.get(User, user_id)
    tz_name = resolve_timezone_name(
        user.timezone if user else None,
        client_timezone,
    )
    day_start_utc, day_end_utc = local_day_bounds_utc(tz_name)

    return (
        db.query(func.count(Prediction.id))
        .filter(
            Prediction.user_id == user_id,
            Prediction.created_at >= day_start_utc,
            Prediction.created_at < day_end_utc,
        )
        .scalar()
        or 0
    )

def get_submission_quota(
    db: Session,
    user_id: UUID,
    *,
    client_timezone: Optional[str] = None,
) -> dict[str, int]:
    used = count_predictions_submitted_today(
        db, user_id, client_timezone=client_timezone
    )
    remaining = max(0, MAX_PREDICTIONS_PER_DAY - used)
    return {
        "used": used,
        "max": MAX_PREDICTIONS_PER_DAY,
        "remaining": remaining,
    }

def create_prediction(
    db: Session,
    *,
    user_id: UUID,
    asset: str,
    asset_name: Optional[str],
    position: Literal["long", "short"],
    entry_price: float,
    target_price: float,
    stop_loss: float,
    lock_started_at: datetime,
    expiry_at: datetime,
    confidence: float,
    thesis: str,
    thesis_image_url: Optional[str] = None,
    client_timezone: Optional[str] = None,
) -> Prediction:
    if not is_analyst_user(db, user_id):
        raise AnalystRequiredError("Analyst subscription required to submit predictions.")

    if (
        count_predictions_submitted_today(db, user_id, client_timezone=client_timezone)
        >= MAX_PREDICTIONS_PER_DAY
    ):
        raise DailyLimitExceededError(
            f"Daily limit reached ({MAX_PREDICTIONS_PER_DAY} predictions per day)."
        )

    submitted_at = datetime.now(timezone.utc)
    validate_submission_payload(
        position=position,
        entry_price=entry_price,
        target_price=target_price,
        stop_loss=stop_loss,
        confidence=confidence,
        thesis=thesis,
        lock_started_at=lock_started_at,
        expiry_at=expiry_at,
        submitted_at=submitted_at,
    )

    prediction = Prediction(
        user_id=user_id,
        asset=asset.strip().upper(),
        asset_name=(asset_name or "").strip() or None,
        prediction_type=PREDICTION_TYPE_TARGET,
        position=position,
        entry_price=entry_price,
        target_price=target_price,
        stop_loss=stop_loss,
        start_time=submitted_at,
        expiry_at=expiry_at,
        lock_started_at=lock_started_at,
        confidence=confidence,
        thesis=thesis.strip(),
        thesis_image_url=thesis_image_url,
        status=PREDICTION_STATUS_ACTIVE,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
