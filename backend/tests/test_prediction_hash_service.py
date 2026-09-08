"""Tests for canonical prediction content hashing."""

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID
from app.services.prediction_hash_service import (
    HASH_VERSION,
    compute_prediction_content_hash,
    content_hash_matches,
    format_fixed_decimal,
    prediction_hash_payload,
)

PREDICTION_ID = UUID("11111111-1111-1111-1111-111111111111")
USER_ID = UUID("22222222-2222-2222-2222-222222222222")
LOCKED_AT = datetime(2026, 8, 18, 12, 0, 0, tzinfo=timezone.utc)

def _prediction(**overrides):
    fields = {
        "id": PREDICTION_ID,
        "user_id": USER_ID,
        "asset": "btc",
        "position": "LONG",
        "entry_price": 42000,
        "target_price": 45000.5,
        "stop_loss": 40000,
        "start_time": LOCKED_AT,
        "lock_started_at": LOCKED_AT,
        "expiry_at": datetime(2026, 8, 18, 14, 0, 0, tzinfo=timezone.utc),
        "confidence": 0.75,
        "thesis": "Breakout setup",
    }
    fields.update(overrides)
    return SimpleNamespace(**fields)

def test_format_fixed_decimal_uses_eight_places():
    assert format_fixed_decimal(42000, 8) == "42000.00000000"
    assert format_fixed_decimal("45000.5", 8) == "45000.50000000"

def test_format_fixed_decimal_rejects_invalid_input():
    import pytest

    with pytest.raises(ValueError, match="finite number"):
        format_fixed_decimal("not-a-number", 8)
    with pytest.raises(ValueError, match="places"):
        format_fixed_decimal(1, -1)

def test_payload_normalizes_asset_position_and_ids():
    payload = prediction_hash_payload(_prediction())
    assert payload["v"] == HASH_VERSION
    assert payload["asset"] == "BTC"
    assert payload["position"] == "long"
    assert payload["prediction_id"] == str(PREDICTION_ID)
    assert payload["user_id"] == str(USER_ID)
    assert payload["confidence"] == "0.7500"
    assert "thesis" not in payload

def test_hash_is_stable_and_ignores_thesis():
    first = compute_prediction_content_hash(_prediction())
    second = compute_prediction_content_hash(_prediction(thesis="Different writeup"))
    assert first == second
    assert len(first) == 64

def test_hash_changes_when_target_price_changes():
    base = compute_prediction_content_hash(_prediction())
    changed = compute_prediction_content_hash(_prediction(target_price=46000))
    assert base != changed

def test_content_hash_matches_stored_digest():
    row = _prediction()
    row.content_hash = compute_prediction_content_hash(row)
    assert content_hash_matches(row) is True
    row.content_hash = "0" * 64
    assert content_hash_matches(row) is False
