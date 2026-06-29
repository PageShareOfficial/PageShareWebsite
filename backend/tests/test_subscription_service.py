"""Unit tests for subscription_service parsing and status mapping."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import UUID

from app.models.user_entitlement import UserEntitlement
from app.services.subscription_service import (
    entitlement_matches_checkout,
    entitlement_to_status,
    parse_subscription_record,
    should_apply_subscription_webhook,
    upsert_from_stripe_subscription,
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

    def test_past_due_within_grace_is_premium(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="analyst",
            interval="monthly",
            status="past_due",
            past_due_grace_ends_at=datetime(2026, 12, 1, tzinfo=timezone.utc),
        )
        status = entitlement_to_status(row)
        assert status.is_premium is True
        assert status.status == "past_due"
        assert status.past_due_grace_ends_at is not None


class TestEntitlementMatchesCheckout:
    def test_matches_active_same_plan_and_interval(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="investor",
            interval="monthly",
            status="active",
        )
        assert entitlement_matches_checkout(row, "investor", "monthly") is True

    def test_does_not_match_different_interval(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="investor",
            interval="monthly",
            status="active",
        )
        assert entitlement_matches_checkout(row, "investor", "yearly") is False

    def test_does_not_match_canceled_plan(self):
        row = UserEntitlement(
            user_id=USER_ID,
            plan_id="investor",
            interval="monthly",
            status="canceled",
        )
        assert entitlement_matches_checkout(row, "investor", "monthly") is False


class TestShouldApplySubscriptionWebhook:
    def test_ignores_canceled_event_for_replaced_subscription(self):
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_yearly",
            plan_id="investor",
            interval="yearly",
            status="active",
        )
        assert (
            should_apply_subscription_webhook(row, "sub_monthly", "canceled")
            is False
        )

    def test_ignores_canceled_event_when_local_subscription_id_cleared(self):
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id=None,
            plan_id="analyst",
            interval="monthly",
            status="canceled",
        )
        assert (
            should_apply_subscription_webhook(row, "sub_analyst", "canceled")
            is False
        )

    def test_applies_active_event_for_new_subscription(self):
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_monthly",
            plan_id="investor",
            interval="monthly",
            status="active",
        )
        assert (
            should_apply_subscription_webhook(row, "sub_yearly", "active") is True
        )


class TestUpsertFromStripeSubscription:
    def test_stale_canceled_webhook_does_not_overwrite_active_plan(self):
        db = MagicMock()
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_yearly",
            plan_id="investor",
            interval="yearly",
            status="active",
        )
        db.get.return_value = row

        result = upsert_from_stripe_subscription(
            db,
            user_id=USER_ID,
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_monthly",
            status="canceled",
            plan_id="investor",
            interval="monthly",
            current_period_end=None,
        )

        assert result.status == "active"
        assert result.stripe_subscription_id == "sub_yearly"
        assert result.interval == "yearly"
        db.commit.assert_not_called()

    def test_canceled_webhook_clears_plan_and_period_fields(self):
        db = MagicMock()
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_yearly",
            plan_id="investor",
            interval="yearly",
            status="active",
            cancel_at_period_end=True,
        )
        db.get.return_value = row

        result = upsert_from_stripe_subscription(
            db,
            user_id=USER_ID,
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_yearly",
            status="canceled",
            plan_id="investor",
            interval="yearly",
            current_period_end=1782864000,
            cancel_at_period_end=False,
        )

        assert result.status == "canceled"
        assert result.plan_id is None
        assert result.interval is None
        assert result.current_period_end is None
        assert result.cancel_at_period_end is False

    def test_active_webhook_without_period_preserves_existing_period(self):
        db = MagicMock()
        existing = datetime(2026, 7, 27, tzinfo=timezone.utc)
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_yearly",
            plan_id="analyst",
            interval="monthly",
            status="active",
            current_period_end=existing,
        )
        db.get.return_value = row

        result = upsert_from_stripe_subscription(
            db,
            user_id=USER_ID,
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_yearly",
            status="active",
            plan_id="analyst",
            interval="monthly",
            current_period_end=None,
            cancel_at_period_end=True,
        )

        assert result.current_period_end == existing
        assert result.cancel_at_period_end is True

    def test_past_due_webhook_keeps_plan_for_grace(self):
        db = MagicMock()
        row = UserEntitlement(
            user_id=USER_ID,
            stripe_subscription_id="sub_yearly",
            plan_id="investor",
            interval="yearly",
            status="active",
        )
        db.get.return_value = row

        result = upsert_from_stripe_subscription(
            db,
            user_id=USER_ID,
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_yearly",
            status="past_due",
            plan_id="investor",
            interval="yearly",
            current_period_end=1782864000,
        )

        assert result.status == "past_due"
        assert result.plan_id == "investor"
        assert result.interval == "yearly"
        assert result.current_period_end is not None


class TestParseSubscriptionRecord:
    def test_parses_metadata_and_recurring_interval(self):
        subscription = {
            "id": "sub_123",
            "customer": "cus_123",
            "status": "active",
            "current_period_end": 1782864000,
            "cancel_at_period_end": True,
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
        assert parsed["cancel_at_period_end"] is True

    def test_defaults_cancel_at_period_end_to_false(self):
        subscription = {
            "id": "sub_789",
            "customer": "cus_789",
            "status": "active",
            "metadata": {"supabase_user_id": str(USER_ID), "plan_id": "analyst"},
            "items": {"data": [{"price": {"recurring": {"interval": "month"}}}]},
        }

        parsed = parse_subscription_record(subscription)
        assert parsed["cancel_at_period_end"] is False

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

    def test_reads_current_period_end_from_item_when_top_level_missing(self):
        subscription = {
            "id": "sub_basil",
            "customer": "cus_basil",
            "status": "active",
            "cancel_at_period_end": True,
            "metadata": {
                "supabase_user_id": str(USER_ID),
                "plan_id": "analyst",
                "interval": "monthly",
            },
            "items": {
                "data": [
                    {
                        "current_period_end": 1782864000,
                        "price": {"recurring": {"interval": "month"}},
                    }
                ]
            },
        }

        parsed = parse_subscription_record(subscription)
        assert parsed["current_period_end"] == 1782864000
        assert parsed["cancel_at_period_end"] is True
