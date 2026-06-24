"""Unit tests for billing_service price map and webhook routing."""

from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest

from app.config import Settings
from app.services.billing_service import (
    BillingNotConfiguredError,
    build_price_map,
    process_webhook_event,
)


def _settings_with_prices() -> Settings:
    settings = Settings()
    settings.stripe_secret_key = "sk_test_x"
    settings.stripe_webhook_secret = "whsec_test"
    settings.stripe_price_id_analyst_monthly = "price_am"
    settings.stripe_price_id_analyst_yearly = "price_ay"
    settings.stripe_price_id_investor_monthly = "price_im"
    settings.stripe_price_id_investor_yearly = "price_iy"
    settings.stripe_customer_portal_return_url = "https://example.com/settings"
    return settings


class TestBuildPriceMap:
    def test_contains_four_plan_interval_keys(self):
        price_map = build_price_map(_settings_with_prices())
        assert price_map[("analyst", "monthly")] == "price_am"
        assert price_map[("analyst", "yearly")] == "price_ay"
        assert price_map[("investor", "monthly")] == "price_im"
        assert price_map[("investor", "yearly")] == "price_iy"


class TestProcessWebhookEvent:
    @patch("app.services.billing_service.handle_subscription_event")
    def test_routes_subscription_updated(self, mock_handle):
        db = MagicMock()
        event = {
            "type": "customer.subscription.updated",
            "data": {"object": {"id": "sub_1", "metadata": {}}},
        }
        process_webhook_event(db, event)
        mock_handle.assert_called_once()

    @patch("app.services.billing_service.handle_checkout_completed")
    def test_routes_checkout_completed(self, mock_handle):
        db = MagicMock()
        event = {
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_1"}},
        }
        process_webhook_event(db, event)
        mock_handle.assert_called_once()


class TestBillingConfiguration:
    def test_construct_webhook_requires_secret(self):
        settings = Settings()
        settings.stripe_webhook_secret = ""

        from app.services.billing_service import construct_webhook_event

        with pytest.raises(BillingNotConfiguredError):
            construct_webhook_event(settings, b"{}", "sig")
