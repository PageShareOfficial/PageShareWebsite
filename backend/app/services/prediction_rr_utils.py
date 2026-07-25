"""Risk-reward helpers for prediction validation and analytics (Net RR)."""

from typing import Literal, Optional
from app.services.prediction_constants import OUTCOME_LOSS, OUTCOME_WIN

Outcome = Optional[Literal["win", "loss", "expired"]]

_ZERO_RISK_EPSILON = 1e-12

def setup_risk_reward(entry: float, target: float, stop: float) -> float:
    """Setup RR: |target − entry| / |entry − stop|.

    Matches signed (target − entry) / (entry − stop) when long/short sides are valid.
    Returns 0.0 when entry equals stop (invalid risk).
    """
    entry_f = float(entry)
    target_f = float(target)
    stop_f = float(stop)
    risk = abs(entry_f - stop_f)
    if risk < _ZERO_RISK_EPSILON:
        return 0.0
    return abs(target_f - entry_f) / risk
    
def net_rr_contribution(outcome: Outcome, setup_rr: float) -> float:
    """Net RR delta for one resolved prediction (expired → 0)."""
    if outcome == OUTCOME_WIN:
        return setup_rr
    if outcome == OUTCOME_LOSS:
        return -setup_rr
    return 0.0
