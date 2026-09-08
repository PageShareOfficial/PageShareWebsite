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
from app.services.billing_constants import PLAN_ID_ANALYST
from app.services.subscription_service import get_user_plan_id
from app.services.coinbase_market_service import (
    CoinbaseUnavailableError,
    UnsupportedAssetError,
    get_live_price,
)
from app.config import get_settings
from app.services.polygon_anchor_service import (
    is_polygon_configured,
    stamp_anchor_fields,
)

class AnalystRequiredError(Exception):
    """User does not have an active analyst subscription."""

class DailyLimitExceededError(Exception):
    """User has reached the daily prediction submission cap."""

class MarketPriceError(Exception):
    """Could not fetch authoritative entry price from Coinbase."""

def is_analyst_user(db: Session, user_id: UUID) -> bool:
    return get_user_plan_id(db, user_id) == PLAN_ID_ANALYST

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

def fetch_live_price_for_asset(asset: str) -> tuple[str, float]:
    """Return normalized base asset and Coinbase live price."""
    try:
        price = get_live_price(asset)
    except UnsupportedAssetError as exc:
        raise MarketPriceError(str(exc)) from exc
    except CoinbaseUnavailableError as exc:
        raise MarketPriceError(str(exc)) from exc
    normalized = asset.strip().upper()
    return normalized, price

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

    _, entry_price = fetch_live_price_for_asset(asset)

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
    return _persist_new_prediction(db, prediction)

def _persist_new_prediction(db: Session, prediction: Prediction) -> Prediction:
    db.add(prediction)
    db.flush()
    stamp_anchor_fields(
        prediction,
        chain_configured=is_polygon_configured(get_settings()),
    )
    db.commit()
    db.refresh(prediction)
    return prediction

def list_predictions_for_user(
    db: Session,
    user_id: UUID,
    *,
    page: int,
    per_page: int,
) -> tuple[list[Prediction], int]:
    """Paginated predictions for the owner, newest first."""
    base = db.query(Prediction).filter(Prediction.user_id == user_id)
    total = base.count()
    rows = (
        base.order_by(Prediction.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return rows, total

def get_prediction_for_user(
    db: Session,
    user_id: UUID,
    prediction_id: UUID,
) -> Optional[Prediction]:
    """Return a prediction when it belongs to the user."""
    return (
        db.query(Prediction)
        .filter(
            Prediction.id == prediction_id,
            Prediction.user_id == user_id,
        )
        .first()
    )
