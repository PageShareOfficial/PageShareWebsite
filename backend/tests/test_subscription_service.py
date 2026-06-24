"""Unit tests for subscription_service parsing and status mapping."""

from datetime import datetime, timezone
from uuid import UUID

from app.models.user_entitlement import UserEntitlement
from app.services.subscription_service import (
    entitlement_to_status,
    parse_subscription_record,
)


USER_ID = UUID("11111111-1111-1111-1111-111111111111")


class TestEntitlementToStatus:
    def test_none_entitlement_returns_free_status(self):
        status = entitlement_to_status(None)
        assert status.is_premium is False
        assert status.plan_id is None
        assert status.status == "none"

    def test_active_analyst_monthly(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="analyst",
            interval="monthly",
            status="active",
            current_period_end=datetime(2026, 7, 1, tzinfo=timezone.utc),
        )
        status = entitlement_to_status(row)
        assert status.is_premium is True
        assert status.plan_id == "analyst"
        assert status.interval == "monthly"
        assert status.status == "active"

    def test_canceled_investor_is_not_premium(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="investor",
            interval="yearly",
            status="canceled",
        )
        status = entitlement_to_status(row)
        assert status.is_premium is False
        assert status.plan_id == "investor"


class TestParseSubscriptionRecord:
    def test_parses_metadata_and_recurring_interval(self):
        subscription = {
            "id": "sub_123",
            "customer": "cus_123",
            "status": "active",
            "current_period_end": 1782864000,
            "metadata": {
                "supabase_user_id": str(USER_ID),
                "plan_id": "investor",
                "interval": "yearly",
            },
            "items": {
                "data": [
                    {
                        "price": {
                            "recurring": {"interval": "year"},
                        }
                    }
                ]
            },
        }

        parsed = parse_subscription_record(subscription)
        assert parsed["user_id"] == USER_ID
        assert parsed["stripe_subscription_id"] == "sub_123"
        assert parsed["plan_id"] == "investor"
        assert parsed["interval"] == "yearly"
        assert parsed["status"] == "active"

    def test_maps_stripe_month_interval_to_monthly(self):
        subscription = {
            "id": "sub_456",
            "customer": "cus_456",
            "status": "trialing",
            "metadata": {"supabase_user_id": str(USER_ID), "plan_id": "analyst"},
            "items": {"data": [{"price": {"recurring": {"interval": "month"}}}]},
        }

        parsed = parse_subscription_record(subscription)
        assert parsed["interval"] == "monthly"
        assert parsed["status"] == "trialing"
