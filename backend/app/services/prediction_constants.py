"""Prediction business rules — must stay aligned with frontend predictionRules.ts."""

from datetime import timedelta

LOCK_DURATION = timedelta(minutes=3)
MIN_EXPIRY_OFFSET = timedelta(minutes=30)
MAX_EXPIRY_OFFSET = timedelta(hours=48)
MIN_RISK_REWARD = 1.2
MIN_TARGET_MOVE_PCT = 0.01
MIN_STOP_MOVE_PCT = 0.005
MAX_PREDICTIONS_PER_DAY = 5
MAX_THESIS_LENGTH = 300
MIN_CONFIDENCE = 0.5
MAX_CONFIDENCE = 0.95
PREDICTION_TYPE_TARGET = "target"
PREDICTION_STATUS_ACTIVE = "active"
