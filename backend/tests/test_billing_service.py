"""Unit tests for billing_service price map and webhook routing."""

from unittest.mock import MagicMock, patch
from uuid import UUID
import pytest
import stripe
from app.config import Settings
from app.models.user_entitlement import UserEntitlement
from app.services.billing_service import (
    AlreadySubscribedError,
    BillingNotConfiguredError,
    NoActiveSubscriptionError,
    PaymentFailedError,
    build_price_map,
    cancel_existing_subscription_for_checkout,
    create_checkout_session,
    process_webhook_event,
    reconcile_entitlement_with_stripe,
    switch_subscription_plan,
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
        settings = _settings_with_prices()
        event = {
            "type": "customer.subscription.updated",
            "data": {"object": {"id": "sub_1", "metadata": {}}},
        }
        process_webhook_event(db, settings, event)
        mock_handle.assert_called_once()

    @patch("app.services.billing_service.handle_checkout_completed")
    def test_routes_checkout_completed(self, mock_handle):
        db = MagicMock()
        settings = _settings_with_prices()
        event = {
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_1"}},
        }
        process_webhook_event(db, settings, event)
        mock_handle.assert_called_once()


class TestBillingConfiguration:
    def test_construct_webhook_requires_secret(self):
        settings = Settings()
        settings.stripe_webhook_secret = ""

        from app.services.billing_service import construct_webhook_event

        with pytest.raises(BillingNotConfiguredError):
            construct_webhook_event(settings, b"{}", "sig")


class TestCancelSubscription:
    @patch("app.services.billing_service._mark_entitlement_canceled_locally")
    @patch("app.services.billing_service._cancel_all_active_subscriptions_for_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_cancel_before_checkout_uses_stripe_customer(
        self,
        mock_get_entitlement,
        mock_cancel_all,
        mock_mark_canceled,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = MagicMock()
        row.stripe_customer_id = "cus_123"
        row.stripe_subscription_id = "sub_123"
        mock_get_entitlement.return_value = row
        mock_cancel_all.return_value = 1

        db = MagicMock()
        settings = _settings_with_prices()
        cancel_existing_subscription_for_checkout(db, settings, user_id)

        mock_cancel_all.assert_called_once_with(settings, "cus_123")
        mock_mark_canceled.assert_called_once_with(db, user_id)

    @patch("app.services.billing_service._mark_entitlement_canceled_locally")
    @patch("app.services.billing_service._cancel_all_active_subscriptions_for_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_free_user_open_checkout_is_not_marked_canceled(
        self,
        mock_get_entitlement,
        mock_cancel_all,
        mock_mark_canceled,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        # Free user: customer was just created, but no subscription exists.
        row = MagicMock()
        row.stripe_customer_id = "cus_new"
        row.stripe_subscription_id = None
        mock_get_entitlement.return_value = row
        mock_cancel_all.return_value = 0

        db = MagicMock()
        settings = _settings_with_prices()
        cancel_existing_subscription_for_checkout(db, settings, user_id)

        mock_cancel_all.assert_called_once_with(settings, "cus_new")
        mock_mark_canceled.assert_not_called()

    @patch("app.services.billing_service.stripe.checkout.Session.create")
    @patch("app.services.billing_service.cancel_existing_subscription_for_checkout")
    @patch("app.services.billing_service.stripe.checkout.Session.list")
    @patch("app.services.billing_service.get_or_create_stripe_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_plan_interval_switch_cancels_existing_subscription(
        self,
        mock_get_entitlement,
        mock_get_customer,
        mock_session_list,
        mock_cancel_existing,
        mock_session_create,
    ):
        from app.schemas.billing import CheckoutSessionBody

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = UserEntitlement(
            user_id=user_id,
            plan_id="investor",
            interval="monthly",
            status="none",
            stripe_subscription_id="sub_monthly",
            stripe_customer_id="cus_123",
        )
        mock_get_entitlement.return_value = row
        mock_get_customer.return_value = "cus_123"
        mock_session_list.return_value = MagicMock(data=[])
        mock_session_create.return_value = {
            "url": "https://checkout.stripe.test/yearly",
            "status": "open",
        }

        body = CheckoutSessionBody(
            plan_id="investor",
            interval="yearly",
            success_url="https://app.test/success",
            cancel_url="https://app.test/cancel",
        )
        url = create_checkout_session(
            MagicMock(),
            _settings_with_prices(),
            user_id=user_id,
            body=body,
        )

        assert url == "https://checkout.stripe.test/yearly"
        mock_cancel_existing.assert_called_once()


class TestCreateCheckoutSession:
    @patch("app.services.billing_service.stripe.checkout.Session.create")
    @patch("app.services.billing_service.stripe.checkout.Session.list")
    @patch("app.services.billing_service.get_or_create_stripe_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_reuses_open_checkout_session(
        self,
        mock_get_entitlement,
        mock_get_customer,
        mock_session_list,
        mock_session_create,
    ):
        from app.schemas.billing import CheckoutSessionBody

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        mock_get_entitlement.return_value = None
        mock_get_customer.return_value = "cus_123"
        mock_session_list.return_value = MagicMock(
            data=[
                {
                    "metadata": {"plan_id": "investor", "interval": "monthly"},
                    "url": "https://checkout.stripe.test/open",
                }
            ]
        )

        body = CheckoutSessionBody(
            plan_id="investor",
            interval="monthly",
            success_url="https://app.test/success",
            cancel_url="https://app.test/cancel",
        )
        url = create_checkout_session(
            MagicMock(),
            _settings_with_prices(),
            user_id=user_id,
            body=body,
        )

        assert url == "https://checkout.stripe.test/open"
        mock_session_create.assert_not_called()

    @patch("app.services.billing_service.get_or_create_stripe_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_rejects_checkout_when_already_subscribed(
        self,
        mock_get_entitlement,
        mock_get_customer,
    ):
        from app.schemas.billing import CheckoutSessionBody

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = UserEntitlement(
            user_id=user_id,
            plan_id="investor",
            interval="monthly",
            status="active",
        )
        mock_get_entitlement.return_value = row
        mock_get_customer.return_value = "cus_123"

        body = CheckoutSessionBody(
            plan_id="investor",
            interval="monthly",
            success_url="https://app.test/success",
            cancel_url="https://app.test/cancel",
        )

        with pytest.raises(AlreadySubscribedError):
            create_checkout_session(
                MagicMock(),
                _settings_with_prices(),
                user_id=user_id,
                body=body,
            )

        mock_get_customer.assert_not_called()


class TestCancelUserStripeSubscription:
    @patch("app.services.billing_service._cancel_all_active_subscriptions_for_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_cancels_all_subs_by_customer_on_account_delete(
        self,
        mock_get_entitlement,
        mock_cancel_all,
    ):
        from app.services.billing_service import cancel_user_stripe_subscription

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = MagicMock()
        row.stripe_customer_id = "cus_123"
        row.stripe_subscription_id = "sub_123"
        mock_get_entitlement.return_value = row

        settings = _settings_with_prices()
        cancel_user_stripe_subscription(MagicMock(), settings, user_id)

        mock_cancel_all.assert_called_once_with(settings, "cus_123")

    @patch("app.services.billing_service._cancel_stripe_subscription_id")
    @patch("app.services.billing_service._cancel_all_active_subscriptions_for_customer")
    @patch("app.services.billing_service.get_entitlement")
    def test_falls_back_to_subscription_id_without_customer(
        self,
        mock_get_entitlement,
        mock_cancel_all,
        mock_cancel_one,
    ):
        from app.services.billing_service import cancel_user_stripe_subscription

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = MagicMock()
        row.stripe_customer_id = None
        row.stripe_subscription_id = "sub_123"
        mock_get_entitlement.return_value = row

        settings = _settings_with_prices()
        cancel_user_stripe_subscription(MagicMock(), settings, user_id)

        mock_cancel_all.assert_not_called()
        mock_cancel_one.assert_called_once_with(settings, "sub_123")

class TestSwitchSubscriptionPlan:
    def _active_investor_monthly_row(self, user_id: UUID) -> UserEntitlement:
        return UserEntitlement(
            user_id=user_id,
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_123",
            plan_id="investor",
            interval="monthly",
            status="active",
        )

    def _live_subscription(self, user_id: UUID) -> dict:
        return {
            "id": "sub_123",
            "customer": "cus_123",
            "status": "active",
            "cancel_at_period_end": False,
            "current_period_end": 1810000000,
            "metadata": {
                "supabase_user_id": str(user_id),
                "plan_id": "investor",
                "interval": "monthly",
            },
            "items": {"data": [{"id": "si_1", "price": {"recurring": {"interval": "month"}}}]},
        }

    @patch("app.services.billing_service.upsert_from_stripe_subscription")
    @patch("app.services.billing_service.stripe.Subscription.modify")
    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_modifies_subscription_in_place_with_proration(
        self,
        mock_get_entitlement,
        mock_subscription_list,
        mock_modify,
        mock_upsert,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        mock_get_entitlement.return_value = self._active_investor_monthly_row(user_id)
        mock_subscription_list.return_value = MagicMock(
            data=[self._live_subscription(user_id)]
        )
        updated = self._live_subscription(user_id)
        updated["metadata"]["interval"] = "yearly"
        updated["items"]["data"][0]["price"]["recurring"]["interval"] = "year"
        mock_modify.return_value = updated

        switch_subscription_plan(
            MagicMock(),
            _settings_with_prices(),
            user_id=user_id,
            plan_id="investor",
            interval="yearly",
        )

        mock_modify.assert_called_once()
        args, kwargs = mock_modify.call_args
        assert args[0] == "sub_123"
        assert kwargs["proration_behavior"] == "always_invoice"
        assert kwargs["cancel_at_period_end"] is False
        assert kwargs["items"] == [{"id": "si_1", "price": "price_iy"}]
        mock_upsert.assert_called_once()
        assert mock_upsert.call_args.kwargs["interval"] == "yearly"

    @patch("app.services.billing_service.get_entitlement")
    def test_rejects_switch_to_current_plan(self, mock_get_entitlement):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        mock_get_entitlement.return_value = self._active_investor_monthly_row(user_id)

        with pytest.raises(AlreadySubscribedError):
            switch_subscription_plan(
                MagicMock(),
                _settings_with_prices(),
                user_id=user_id,
                plan_id="investor",
                interval="monthly",
            )

    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_raises_when_no_live_subscription(
        self,
        mock_get_entitlement,
        mock_subscription_list,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        mock_get_entitlement.return_value = self._active_investor_monthly_row(user_id)
        mock_subscription_list.return_value = MagicMock(data=[])

        with pytest.raises(NoActiveSubscriptionError):
            switch_subscription_plan(
                MagicMock(),
                _settings_with_prices(),
                user_id=user_id,
                plan_id="analyst",
                interval="yearly",
            )

    @patch("app.services.billing_service.stripe.Subscription.modify")
    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_raises_payment_failed_on_card_error(
        self,
        mock_get_entitlement,
        mock_subscription_list,
        mock_modify,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        mock_get_entitlement.return_value = self._active_investor_monthly_row(user_id)
        mock_subscription_list.return_value = MagicMock(
            data=[self._live_subscription(user_id)]
        )
        mock_modify.side_effect = stripe.CardError(
            "declined", "number", "card_declined"
        )

        with pytest.raises(PaymentFailedError):
            switch_subscription_plan(
                MagicMock(),
                _settings_with_prices(),
                user_id=user_id,
                plan_id="analyst",
                interval="yearly",
            )


class TestReconcileEntitlementWithStripe:
    @patch("app.services.billing_service.upsert_from_stripe_subscription")
    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_upgrades_when_local_row_is_canceled_but_stripe_is_active(
        self,
        mock_get_entitlement,
        mock_subscription_list,
        mock_upsert,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = UserEntitlement(
            user_id=user_id,
            stripe_customer_id="cus_123",
            plan_id="analyst",
            interval="monthly",
            status="canceled",
        )
        mock_get_entitlement.return_value = row
        mock_subscription_list.return_value = MagicMock(
            data=[
                {
                    "id": "sub_investor_yearly",
                    "customer": "cus_123",
                    "status": "active",
                    "current_period_end": 1782864000,
                    "metadata": {
                        "supabase_user_id": str(user_id),
                        "plan_id": "investor",
                        "interval": "yearly",
                    },
                    "items": {
                        "data": [
                            {"price": {"recurring": {"interval": "year"}}}
                        ]
                    },
                }
            ]
        )

        reconcile_entitlement_with_stripe(
            MagicMock(),
            _settings_with_prices(),
            user_id,
        )

        mock_upsert.assert_called_once()
        assert mock_upsert.call_args.kwargs["plan_id"] == "investor"
        assert mock_upsert.call_args.kwargs["interval"] == "yearly"
        assert mock_upsert.call_args.kwargs["status"] == "active"

    @patch("app.services.billing_service._mark_entitlement_canceled_locally")
    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_downgrades_when_local_premium_but_stripe_has_no_active_sub(
        self,
        mock_get_entitlement,
        mock_subscription_list,
        mock_mark_canceled,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = UserEntitlement(
            user_id=user_id,
            stripe_customer_id="cus_123",
            plan_id="investor",
            interval="yearly",
            status="active",
        )
        mock_get_entitlement.return_value = row
        mock_subscription_list.return_value = MagicMock(data=[])

        db = MagicMock()
        reconcile_entitlement_with_stripe(
            db,
            _settings_with_prices(),
            user_id,
        )

        mock_mark_canceled.assert_called_once_with(db, user_id)

    @patch("app.services.billing_service.upsert_from_stripe_subscription")
    @patch("app.services.billing_service._mark_entitlement_canceled_locally")
    @patch("app.services.billing_service.stripe.Subscription.list")
    @patch("app.services.billing_service.get_entitlement")
    def test_keeps_premium_when_stripe_sub_active_at_period_end(
        self,
        mock_get_entitlement,
        mock_subscription_list,
        mock_mark_canceled,
        mock_upsert,
    ):
        user_id = UUID("11111111-1111-1111-1111-111111111111")
        row = UserEntitlement(
            user_id=user_id,
            stripe_customer_id="cus_123",
            plan_id="investor",
            interval="yearly",
            status="active",
        )
        mock_get_entitlement.return_value = row
        mock_subscription_list.return_value = MagicMock(
            data=[
                {
                    "id": "sub_investor_yearly",
                    "customer": "cus_123",
                    "status": "active",
                    "cancel_at_period_end": True,
                    "current_period_end": 1782864000,
                    "metadata": {
                        "supabase_user_id": str(user_id),
                        "plan_id": "investor",
                        "interval": "yearly",
                    },
                    "items": {
                        "data": [
                            {"price": {"recurring": {"interval": "year"}}}
                        ]
                    },
                }
            ]
        )

        reconcile_entitlement_with_stripe(
            MagicMock(),
            _settings_with_prices(),
            user_id,
        )

        mock_upsert.assert_called_once()
        mock_mark_canceled.assert_not_called()
