"""Pure validation helpers for prediction submission."""

from datetime import datetime, timezone
from typing import Literal, Optional
from app.services.prediction_constants import (
    LOCK_DURATION,
    MAX_CONFIDENCE,
    MAX_EXPIRY_OFFSET,
    MAX_THESIS_LENGTH,
    MIN_CONFIDENCE,
    MIN_EXPIRY_OFFSET,
    MIN_RISK_REWARD,
    MIN_STOP_MOVE_PCT,
    MIN_TARGET_MOVE_PCT,
)

class PredictionValidationError(ValueError):
    """Raised when prediction input fails business rules."""

def compute_risk_reward(entry: float, target: float, stop: float) -> float:
    denom = entry - stop
    if abs(denom) < 1e-12:
        return float("nan")
    return (target - entry) / denom

def validate_position_sides(
    position: Literal["long", "short"],
    entry: float,
    target: float,
    stop: float,
) -> None:
    if position == "long":
        if not (target > entry and stop < entry):
            raise PredictionValidationError(
                "For a long: target must be above entry, stop loss below entry."
            )
        return

    if not (target < entry and stop > entry):
        raise PredictionValidationError(
            "For a short: target must be below entry, stop loss above entry."
        )

def validate_price_distance(entry: float, target: float, stop: float) -> None:
    min_target_move = MIN_TARGET_MOVE_PCT * entry
    min_stop_move = MIN_STOP_MOVE_PCT * entry
    if abs(target - entry) < min_target_move:
        raise PredictionValidationError(
            f"Target must be at least 1% from entry (≥ {min_target_move:.4f} move)."
        )
    if abs(stop - entry) < min_stop_move:
        raise PredictionValidationError(
            f"Stop loss must be at least 0.5% from entry (≥ {min_stop_move:.4f} move)."
        )

def validate_risk_reward(entry: float, target: float, stop: float) -> None:
    risk_reward = compute_risk_reward(entry, target, stop)
    if risk_reward != risk_reward:  # NaN check
        raise PredictionValidationError("Entry and stop loss cannot be equal.")
    if risk_reward < MIN_RISK_REWARD:
        raise PredictionValidationError(
            f"Risk-reward must be ≥ {MIN_RISK_REWARD} (yours is {risk_reward:.2f})."
        )

def validate_confidence(confidence: float) -> None:
    if confidence < MIN_CONFIDENCE or confidence > MAX_CONFIDENCE:
        raise PredictionValidationError(
            f"Confidence must be between {MIN_CONFIDENCE} and {MAX_CONFIDENCE}."
        )

def validate_thesis(thesis: str) -> None:
    trimmed = thesis.strip()
    if not trimmed:
        raise PredictionValidationError("Thesis is required.")
    if len(trimmed) > MAX_THESIS_LENGTH:
        raise PredictionValidationError(
            f"Thesis must be at most {MAX_THESIS_LENGTH} characters."
        )

def validate_lock_window(
    lock_started_at: datetime,
    *,
    submitted_at: Optional[datetime] = None,
) -> None:
    moment = submitted_at or datetime.now(timezone.utc)
    lock_start = _ensure_utc(lock_started_at)
    if moment > lock_start + LOCK_DURATION:
        raise PredictionValidationError(
            "Price lock expired. Search the asset again to refresh the entry price."
        )
    if moment < lock_start:
        raise PredictionValidationError("Invalid price lock timestamp.")

def validate_expiry_window(start_time: datetime, expiry_at: datetime) -> None:
    start = _ensure_utc(start_time)
    expiry = _ensure_utc(expiry_at)
    min_expiry = start + MIN_EXPIRY_OFFSET
    max_expiry = start + MAX_EXPIRY_OFFSET
    if expiry < min_expiry or expiry > max_expiry:
        raise PredictionValidationError(
            "Expiry must be between 30 minutes and 48 hours after submission."
        )

def validate_submission_payload(
    *,
    position: Literal["long", "short"],
    entry_price: float,
    target_price: float,
    stop_loss: float,
    confidence: float,
    thesis: str,
    lock_started_at: datetime,
    expiry_at: datetime,
    submitted_at: Optional[datetime] = None,
) -> None:
    if entry_price <= 0 or target_price <= 0 or stop_loss <= 0:
        raise PredictionValidationError("Prices must be positive numbers.")

    validate_confidence(confidence)
    validate_thesis(thesis)
    validate_lock_window(lock_started_at, submitted_at=submitted_at)

    start_time = submitted_at or datetime.now(timezone.utc)
    validate_expiry_window(start_time, expiry_at)
    validate_position_sides(position, entry_price, target_price, stop_loss)
    validate_price_distance(entry_price, target_price, stop_loss)
    validate_risk_reward(entry_price, target_price, stop_loss)

def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
