"""Prediction business rules — must stay aligned with frontend predictionRules.ts."""

from datetime import timedelta

# --- Timing & limits (create / settle) ---
LOCK_DURATION = timedelta(minutes=3)
MIN_EXPIRY_OFFSET = timedelta(minutes=30)
MAX_EXPIRY_OFFSET = timedelta(hours=48)
MIN_RISK_REWARD = 1.2
MIN_TARGET_MOVE_PCT = 0.01
MIN_STOP_MOVE_PCT = 0.005
MAX_PREDICTIONS_PER_DAY = 5
SETTLE_DUE_PER_REQUEST = 5
MAX_THESIS_LENGTH = 300
MIN_CONFIDENCE = 0.5
MAX_CONFIDENCE = 0.95

# --- Enums (DB / API string values) ---
PREDICTION_TYPE_TARGET = "target"
PREDICTION_STATUS_ACTIVE = "active"
PREDICTION_STATUS_COMPLETED = "completed"
PREDICTION_STATUS_EXPIRED = "expired"
PREDICTION_STATUS_INVALID = "invalid"
POSITION_LONG = "long"
POSITION_SHORT = "short"
OUTCOME_WIN = "win"
OUTCOME_LOSS = "loss"
OUTCOME_EXPIRED = "expired"
RESOLUTION_SOURCE_COINBASE = "coinbase"

RESOLVED_OUTCOMES = frozenset({OUTCOME_WIN, OUTCOME_LOSS, OUTCOME_EXPIRED})
RESOLVED_STATUSES = frozenset(
    {PREDICTION_STATUS_COMPLETED, PREDICTION_STATUS_EXPIRED}
)

# --- Analytics dashboard ---
ANALYTICS_LOOKBACK_DAYS = 30
ANALYTICS_TOP_ASSETS_LIMIT = 5
