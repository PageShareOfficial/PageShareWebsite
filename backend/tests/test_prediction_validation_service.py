"""Tests for prediction submission validation rules."""

from datetime import datetime, timedelta, timezone
import pytest
from app.services.prediction_validation_service import (
    PredictionValidationError,
    validate_expiry_window,
    validate_lock_window,
    validate_submission_payload,
)

def _base_payload(**overrides):
    now = datetime.now(timezone.utc)
    payload = {
        "position": "long",
        "entry_price": 100.0,
        "target_price": 110.0,
        "stop_loss": 95.0,
        "confidence": 0.75,
        "thesis": "Breakout setup",
        "lock_started_at": now,
        "expiry_at": now + timedelta(hours=2),
        "submitted_at": now,
    }
    payload.update(overrides)
    return payload

def test_valid_long_prediction_passes():
    validate_submission_payload(**_base_payload())

def test_short_position_requires_correct_side_order():
    with pytest.raises(PredictionValidationError):
        validate_submission_payload(
            **_base_payload(
                position="short",
                target_price=110.0,
                stop_loss=95.0,
            )
        )

def test_risk_reward_below_minimum_fails():
    with pytest.raises(PredictionValidationError, match="Risk-reward"):
        validate_submission_payload(
            **_base_payload(
                target_price=101.0,
                stop_loss=90.0,
            )
        )

def test_expiry_before_minimum_duration_fails():
    now = datetime.now(timezone.utc)
    with pytest.raises(PredictionValidationError, match="Expiry must be"):
        validate_expiry_window(now, now + timedelta(minutes=10))

def test_lock_expired_fails():
    now = datetime.now(timezone.utc)
    with pytest.raises(PredictionValidationError, match="Price lock expired"):
        validate_lock_window(
            now - timedelta(minutes=4),
            submitted_at=now,
        )
