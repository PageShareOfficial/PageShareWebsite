"""Tests for prediction analytics access and summary."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.prediction_analytics_service import (
    AnalyticsLifetimeStats,
    AnalyticsPeriodStats,
    AnalyticsTradingStyle,
    PredictionAnalyticsDashboard,
    get_analyst_analytics_for_investor,
    get_own_analytics,
)
from app.services.prediction_service import AnalystRequiredError
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    InvestorRequiredError,
)

def _sample_dashboard() -> PredictionAnalyticsDashboard:
    period_start = datetime(2026, 7, 7, tzinfo=timezone.utc)
    period_end = datetime(2026, 8, 6, tzinfo=timezone.utc)
    return PredictionAnalyticsDashboard(
        rank=3,
        rank_total=10,
        net_rr_30d=2.5,
        recent_30d=AnalyticsPeriodStats(
            net_rr=2.5,
            win_rate_percent=55.0,
            resolved_count=4,
            wins=2,
            losses=1,
            expired=1,
            net_return_percent=12.5,
        ),
        recent_30d_period_start=period_start,
        recent_30d_period_end=period_end,
        net_rr_series_30d=(),
        resolved_returns_30d=(),
        lifetime=AnalyticsLifetimeStats(
            total_predictions=12,
            active_count=2,
            resolved_count=10,
            wins=6,
            losses=3,
            expired=1,
            win_rate_percent=66.7,
            average_return_percent=1.2,
            net_return_percent=15.0,
            best_return_percent=8.5,
            worst_return_percent=-4.2,
            max_trade_duration_hours=48.0,
        ),
        style=AnalyticsTradingStyle(
            long_count=7,
            short_count=3,
            long_percent=70.0,
            short_percent=30.0,
            top_assets=(),
            average_confidence=0.75,
            average_setup_rr=1.6,
        ),
    )

def test_get_own_analytics_requires_analyst_plan():
    db = MagicMock()
    user_id = uuid4()
    with patch(
        "app.services.prediction_analytics_service.is_analyst_user",
        return_value=False,
    ):
        with pytest.raises(AnalystRequiredError):
            get_own_analytics(db, user_id)

def test_get_own_analytics_maps_lifetime_summary():
    db = MagicMock()
    user_id = uuid4()
    user = MagicMock()
    user.id = user_id
    db.get.return_value = user
    dashboard = _sample_dashboard()
    with patch(
        "app.services.prediction_analytics_service.is_analyst_user",
        return_value=True,
    ), patch(
        "app.services.prediction_analytics_service.build_analytics_dashboard",
        return_value=dashboard,
    ):
        _, summary = get_own_analytics(db, user_id)
    assert summary.total_predictions == 12
    assert summary.wins == 6
    assert summary.rank == 3

def test_get_analyst_analytics_for_investor_requires_investor():
    db = MagicMock()
    with patch(
        "app.services.prediction_analytics_service.assert_investor_user",
        side_effect=InvestorRequiredError("investor"),
    ):
        with pytest.raises(InvestorRequiredError):
            get_analyst_analytics_for_investor(db, uuid4(), "alice")

def test_get_analyst_analytics_for_investor_unknown_user():
    db = MagicMock()
    with patch(
        "app.services.prediction_analytics_service.assert_investor_user",
        return_value=None,
    ), patch(
        "app.services.prediction_analytics_service.get_user_by_username",
        return_value=None,
    ):
        with pytest.raises(LookupError):
            get_analyst_analytics_for_investor(db, uuid4(), "missing")

def test_get_analyst_analytics_for_investor_requires_analyst_target():
    db = MagicMock()
    user = MagicMock()
    user.id = uuid4()
    with patch(
        "app.services.prediction_analytics_service.assert_investor_user",
        return_value=None,
    ), patch(
        "app.services.prediction_analytics_service.get_user_by_username",
        return_value=user,
    ), patch(
        "app.services.prediction_analytics_service.assert_analyst_target",
        side_effect=AnalystTargetRequiredError("not analyst"),
    ):
        with pytest.raises(AnalystTargetRequiredError):
            get_analyst_analytics_for_investor(db, uuid4(), "bob")
