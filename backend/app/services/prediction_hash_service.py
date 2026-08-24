"""Canonical SHA-256 content hash for a prediction (thesis excluded)."""

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from json import dumps
from typing import Any, Protocol
from uuid import UUID

HASH_VERSION = "pageshare:prediction:v1"
PRICE_DECIMAL_PLACES = 8
CONFIDENCE_DECIMAL_PLACES = 4

class HashablePrediction(Protocol):
    """Minimal prediction shape needed for the canonical content hash."""

    id: Any
    user_id: Any
    asset: Any
    position: Any
    entry_price: Any
    target_price: Any
    stop_loss: Any
    confidence: Any
    start_time: datetime
    lock_started_at: datetime
    expiry_at: datetime
    content_hash: str | None

def format_fixed_decimal(value: Any, places: int) -> str:
    """Format a numeric value to a fixed number of decimal places."""
    if places < 0:
        raise ValueError("places must be >= 0")
    try:
        quantized = Decimal(str(value)).quantize(Decimal("1").scaleb(-places))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError("value must be a finite number") from exc
    return f"{quantized:.{places}f}"

def to_utc_iso(value: datetime) -> str:
    """Return a deterministic UTC ISO-8601 timestamp with Z suffix."""
    if not isinstance(value, datetime):
        raise TypeError("value must be a datetime")
    if value.tzinfo is None:
        aware = value.replace(tzinfo=timezone.utc)
    else:
        aware = value.astimezone(timezone.utc)
    return aware.isoformat().replace("+00:00", "Z")

def prediction_hash_payload(prediction: HashablePrediction) -> dict[str, str]:
    """Fields included in the on-chain content hash (no thesis / media)."""
    return {
        "asset": str(prediction.asset).strip().upper(),
        "confidence": format_fixed_decimal(
            prediction.confidence, CONFIDENCE_DECIMAL_PLACES
        ),
        "entry_price": format_fixed_decimal(prediction.entry_price, PRICE_DECIMAL_PLACES),
        "expiry_at": to_utc_iso(prediction.expiry_at),
        "lock_started_at": to_utc_iso(prediction.lock_started_at),
        "position": str(prediction.position).strip().lower(),
        "prediction_id": str(UUID(str(prediction.id))),
        "start_time": to_utc_iso(prediction.start_time),
        "stop_loss": format_fixed_decimal(prediction.stop_loss, PRICE_DECIMAL_PLACES),
        "target_price": format_fixed_decimal(
            prediction.target_price, PRICE_DECIMAL_PLACES
        ),
        "user_id": str(UUID(str(prediction.user_id))),
        "v": HASH_VERSION,
    }

def compute_prediction_content_hash(prediction: HashablePrediction) -> str:
    """SHA-256 hex digest of the canonical JSON payload (no 0x prefix)."""
    canonical = dumps(
        prediction_hash_payload(prediction),
        separators=(",", ":"),
        sort_keys=True,
    )
    return sha256(canonical.encode("utf-8")).hexdigest()

def content_hash_matches(prediction: HashablePrediction) -> bool:
    """True when the stored hash equals a fresh canonical hash."""
    stored = (prediction.content_hash or "").strip().lower().removeprefix("0x")
    if not stored:
        return False
    return stored == compute_prediction_content_hash(prediction)
