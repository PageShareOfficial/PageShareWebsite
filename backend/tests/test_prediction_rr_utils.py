"""Tests for prediction RR utils."""

from app.services.prediction_rr_utils import net_rr_contribution, setup_risk_reward

def test_setup_risk_reward_uses_absolute_moves():
    assert setup_risk_reward(100.0, 110.0, 95.0) == 2.0

def test_net_rr_contribution_signs():
    assert net_rr_contribution("win", 1.5) == 1.5
    assert net_rr_contribution("loss", 1.5) == -1.5
    assert net_rr_contribution("expired", 1.5) == 0.0
