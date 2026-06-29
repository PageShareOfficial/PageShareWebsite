"""Unit tests for billing_constants (price map, premium status)."""

import pytest

from app.services.billing_constants import (
    is_premium_status,
    normalize_interval,
    normalize_plan_id,
    resolve_stripe_price_id,
)


PRICE_MAP = {
    ("analyst", "monthly"): "price_analyst_monthly",
    ("analyst", "yearly"): "price_analyst_yearly",
    ("investor", "monthly"): "price_investor_monthly",
    ("investor", "yearly"): "price_investor_yearly",
}


class TestResolveStripePriceId:
    @pytest.mark.parametrize(
        "plan_id,interval,expected",
        [
            ("analyst", "monthly", "price_analyst_monthly"),
            ("analyst", "yearly", "price_analyst_yearly"),
            ("investor", "monthly", "price_investor_monthly"),
            ("investor", "yearly", "price_investor_yearly"),
        ],
    )
    def test_resolves_all_four_combinations(
        self, plan_id: str, interval: str, expected: str
    ):
        assert resolve_stripe_price_id(plan_id, interval, PRICE_MAP) == expected

    def test_rejects_invalid_plan_id(self):
        with pytest.raises(ValueError, match="Invalid plan_id"):
            resolve_stripe_price_id("premium", "monthly", PRICE_MAP)

    def test_rejects_invalid_interval(self):
        with pytest.raises(ValueError, match="Invalid interval"):
            resolve_stripe_price_id("analyst", "weekly", PRICE_MAP)

    def test_rejects_missing_price_configuration(self):
        with pytest.raises(ValueError, match="not configured"):
            resolve_stripe_price_id("analyst", "monthly", {})


class TestPremiumStatus:
    @pytest.mark.parametrize("status", ["active", "trialing"])
    def test_premium_statuses(self, status: str):
        assert is_premium_status(status) is True

    @pytest.mark.parametrize("status", ["canceled", "incomplete", "none", None])
    def test_non_premium_statuses(self, status: str | None):
        assert is_premium_status(status) is False

    def test_past_due_alone_is_not_premium_status(self):
        assert is_premium_status("past_due") is False


class TestPremiumEntitlement:
    def test_past_due_within_grace_is_premium(self):
        from datetime import datetime, timedelta, timezone

        from app.services.billing_constants import is_premium_entitlement

        now = datetime(2026, 6, 10, tzinfo=timezone.utc)
        grace_end = now + timedelta(days=3)
        assert is_premium_entitlement("past_due", grace_end, now=now) is True

    def test_past_due_after_grace_is_not_premium(self):
        from datetime import datetime, timedelta, timezone

        from app.services.billing_constants import is_premium_entitlement

        now = datetime(2026, 6, 10, tzinfo=timezone.utc)
        grace_end = now - timedelta(days=1)
        assert is_premium_entitlement("past_due", grace_end, now=now) is False


class TestNormalizers:
    def test_normalize_plan_id(self):
        assert normalize_plan_id("analyst") == "analyst"
        assert normalize_plan_id("investor") == "investor"
        assert normalize_plan_id("premium") is None

    def test_normalize_interval(self):
        assert normalize_interval("monthly") == "monthly"
        assert normalize_interval("yearly") == "yearly"
        assert normalize_interval("weekly") is None
