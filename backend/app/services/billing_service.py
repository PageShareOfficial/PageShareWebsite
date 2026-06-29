"""Stripe Checkout, Portal, and webhook handling."""

import logging
from typing import Any, Optional
from uuid import UUID
import stripe
from sqlalchemy.orm import Session
from app.config import Settings
from app.schemas.billing import CheckoutSessionBody
from app.services.billing_constants import resolve_stripe_price_id
from app.services.subscription_service import (
    entitlement_matches_checkout,
    get_entitlement,
    get_or_create_entitlement,
    parse_subscription_record,
    row_grants_premium,
    upsert_from_stripe_subscription,
)

logger = logging.getLogger(__name__)
class BillingNotConfiguredError(Exception):
    """Raised when required Stripe env vars are missing."""


class AlreadySubscribedError(Exception):
    """Raised when checkout is requested for a plan the user already has."""


class NoActiveSubscriptionError(Exception):
    """Raised when an in-place plan switch is requested but no live sub exists."""


class PaymentFailedError(Exception):
    """Raised when the prorated charge for a plan switch cannot be collected."""

def _require_stripe_config(settings: Settings) -> None:
    if not settings.stripe_secret_key:
        raise BillingNotConfiguredError("STRIPE_SECRET_KEY is not configured")

def build_price_map(settings: Settings) -> dict[tuple[str, str], str]:
    return {
        ("analyst", "monthly"): settings.stripe_price_id_analyst_monthly,
        ("analyst", "yearly"): settings.stripe_price_id_analyst_yearly,
        ("investor", "monthly"): settings.stripe_price_id_investor_monthly,
        ("investor", "yearly"): settings.stripe_price_id_investor_yearly,
    }

def _configure_stripe(settings: Settings) -> None:
    _require_stripe_config(settings)
    stripe.api_key = settings.stripe_secret_key

def get_or_create_stripe_customer(
    db: Session,
    settings: Settings,
    user_id: UUID,
    email: Optional[str] = None,
) -> str:
    _configure_stripe(settings)
    row = get_or_create_entitlement(db, user_id)
    if row.stripe_customer_id:
        return row.stripe_customer_id

    customer = stripe.Customer.create(
        email=email,
        metadata={"supabase_user_id": str(user_id)},
    )
    row.stripe_customer_id = customer["id"]
    db.add(row)
    db.commit()
    db.refresh(row)
    return customer["id"]

def _cancel_stripe_subscription_id(
    settings: Settings,
    subscription_id: str,
) -> None:
    _configure_stripe(settings)
    try:
        stripe.Subscription.cancel(subscription_id)
    except stripe.InvalidRequestError as exc:
        if "No such subscription" not in str(exc):
            raise

def _mark_entitlement_canceled_locally(db: Session, user_id: UUID) -> None:
    row = get_entitlement(db, user_id)
    if not row:
        return
    row.status = "canceled"
    row.stripe_subscription_id = None
    row.plan_id = None
    row.interval = None
    row.current_period_end = None
    row.cancel_at_period_end = False
    row.past_due_grace_ends_at = None
    db.add(row)
    db.commit()

def _find_open_checkout_session_url(
    settings: Settings,
    customer_id: str,
    plan_id: str,
    interval: str,
) -> Optional[str]:
    """Reuse an in-flight Checkout session so double-clicks are idempotent."""
    _configure_stripe(settings)
    sessions = stripe.checkout.Session.list(
        customer=customer_id,
        status="open",
        limit=10,
    )
    for session in sessions.data:
        metadata = session.get("metadata") or {}
        if metadata.get("plan_id") != plan_id or metadata.get("interval") != interval:
            continue
        url = session.get("url")
        if url:
            return url
    return None

def _cancel_all_active_subscriptions_for_customer(
    settings: Settings,
    customer_id: str,
) -> int:
    """Cancel every active Stripe subscription on a customer (source of truth).

    Returns the number of subscriptions canceled so callers can avoid mutating
    local state when there was nothing to cancel.
    """
    _configure_stripe(settings)
    canceled_count = 0
    for status in ("active", "trialing", "past_due"):
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status=status,
            limit=20,
        )
        for subscription in subscriptions.auto_paging_iter():
            try:
                stripe.Subscription.cancel(subscription.id)
                canceled_count += 1
                logger.info(
                    "Canceled subscription %s for customer %s before checkout",
                    subscription.id,
                    customer_id,
                )
            except stripe.InvalidRequestError as exc:
                if "No such subscription" not in str(exc):
                    logger.warning(
                        "Failed to cancel subscription %s: %s",
                        subscription.id,
                        exc,
                    )
    return canceled_count

def _cancel_other_active_subscriptions(
    settings: Settings,
    customer_id: str,
    keep_subscription_id: str,
) -> None:
    """Keep a single active subscription per customer (safety net for duplicate checkouts)."""
    _configure_stripe(settings)
    for status in ("active", "trialing", "past_due"):
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status=status,
            limit=20,
        )
        for subscription in subscriptions.auto_paging_iter():
            if subscription.id == keep_subscription_id:
                continue
            try:
                stripe.Subscription.cancel(subscription.id)
                logger.info(
                    "Canceled duplicate subscription %s for customer %s",
                    subscription.id,
                    customer_id,
                )
            except stripe.InvalidRequestError as exc:
                if "No such subscription" not in str(exc):
                    logger.warning(
                        "Failed to cancel duplicate subscription %s: %s",
                        subscription.id,
                        exc,
                    )

def cancel_existing_subscription_for_checkout(
    db: Session,
    settings: Settings,
    user_id: UUID,
) -> None:
    """
    Cancel all Stripe subscriptions before a new checkout (plan/interval switch).
    Uses Stripe as source of truth — not only the local DB row.

    Only resets the local row when an existing subscription was actually
    canceled, so a free user who merely opens checkout stays "none" (not
    flipped to "canceled" just because a Stripe customer was created).
    """
    row = get_entitlement(db, user_id)
    if not row:
        return

    canceled_any = False
    if row.stripe_customer_id:
        canceled_any = (
            _cancel_all_active_subscriptions_for_customer(
                settings,
                row.stripe_customer_id,
            )
            > 0
        )
    elif row.stripe_subscription_id:
        try:
            _cancel_stripe_subscription_id(settings, row.stripe_subscription_id)
            canceled_any = True
        except BillingNotConfiguredError:
            raise
        except Exception as exc:
            logger.warning(
                "Failed to cancel subscription %s before checkout for user %s: %s",
                row.stripe_subscription_id,
                user_id,
                exc,
            )
            raise

    if canceled_any or row.stripe_subscription_id:
        _mark_entitlement_canceled_locally(db, user_id)

def cancel_user_stripe_subscription(
    db: Session,
    settings: Settings,
    user_id: UUID,
) -> None:
    """
    Cancel every active Stripe subscription when deleting an account.

    Cancels by customer (Stripe as source of truth) rather than only the locally
    stored subscription id, so a deleted account can never keep being billed even
    if the DB drifted or the customer somehow has more than one subscription.
    Best-effort: logs on failure and never blocks account deletion.
    """
    row = get_entitlement(db, user_id)
    if not row:
        return

    try:
        _configure_stripe(settings)
    except BillingNotConfiguredError:
        logger.info(
            "Stripe not configured; skipping subscription cancel for user %s",
            user_id,
        )
        return

    try:
        if row.stripe_customer_id:
            _cancel_all_active_subscriptions_for_customer(
                settings,
                row.stripe_customer_id,
            )
        elif row.stripe_subscription_id:
            _cancel_stripe_subscription_id(settings, row.stripe_subscription_id)
    except Exception as exc:
        logger.warning(
            "Failed to cancel subscriptions for deleted user %s: %s",
            user_id,
            exc,
        )

def create_checkout_session(
    db: Session,
    settings: Settings,
    *,
    user_id: UUID,
    body: CheckoutSessionBody,
    email: Optional[str] = None,
) -> str:
    _configure_stripe(settings)
    price_map = build_price_map(settings)
    price_id = resolve_stripe_price_id(body.plan_id, body.interval, price_map)

    row = get_entitlement(db, user_id)
    if entitlement_matches_checkout(row, body.plan_id, body.interval):
        raise AlreadySubscribedError(
            "You already have an active subscription for this plan. "
            "Use Manage billing to update payment details."
        )

    customer_id = get_or_create_stripe_customer(db, settings, user_id, email)

    existing_url = _find_open_checkout_session_url(
        settings,
        customer_id,
        body.plan_id,
        body.interval,
    )
    if existing_url:
        return existing_url

    if not entitlement_matches_checkout(row, body.plan_id, body.interval):
        cancel_existing_subscription_for_checkout(db, settings, user_id)

    # No Stripe idempotency key: double-click protection is handled by reusing
    # the open Checkout session above, and a static key collides whenever the
    # customer or URLs change (e.g. re-subscribe after cancel within 24h).
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        client_reference_id=str(user_id),
        metadata={
            "supabase_user_id": str(user_id),
            "plan_id": body.plan_id,
            "interval": body.interval,
        },
        subscription_data={
            "metadata": {
                "supabase_user_id": str(user_id),
                "plan_id": body.plan_id,
                "interval": body.interval,
            }
        },
    )

    url = session.get("url")
    if not url:
        raise RuntimeError("Stripe checkout session did not return a URL")
    return url

def switch_subscription_plan(
    db: Session,
    settings: Settings,
    *,
    user_id: UUID,
    plan_id: str,
    interval: str,
) -> None:
    """
    Switch an existing active subscription to a new plan/interval in place.

    Uses Stripe proration (always_invoice) so the unused portion of the current
    plan is credited and only the difference is charged immediately. The same
    subscription is modified, so the customer never loses access and is never
    sent through a second checkout (Cursor-style switch).
    """
    _configure_stripe(settings)
    price_map = build_price_map(settings)
    new_price_id = resolve_stripe_price_id(plan_id, interval, price_map)

    row = get_entitlement(db, user_id)
    if entitlement_matches_checkout(row, plan_id, interval):
        raise AlreadySubscribedError("You are already subscribed to this plan.")
    if not row or not row.stripe_customer_id:
        raise NoActiveSubscriptionError(
            "No active subscription to switch. Start a checkout instead."
        )

    subscription = _find_active_subscription_for_customer(
        settings,
        row.stripe_customer_id,
    )
    if subscription is None:
        raise NoActiveSubscriptionError(
            "No active subscription to switch. Start a checkout instead."
        )

    items = subscription.get("items", {}).get("data") or []
    if not items:
        raise NoActiveSubscriptionError(
            "Active subscription has no billable item to switch."
        )

    try:
        updated = stripe.Subscription.modify(
            subscription["id"],
            items=[{"id": items[0]["id"], "price": new_price_id}],
            proration_behavior="always_invoice",
            payment_behavior="error_if_incomplete",
            cancel_at_period_end=False,
            metadata={
                "supabase_user_id": str(user_id),
                "plan_id": plan_id,
                "interval": interval,
            },
        )
    except stripe.CardError as exc:
        raise PaymentFailedError(
            "Your card was declined for the plan change. "
            "Update your payment method and try again."
        ) from exc

    parsed = parse_subscription_record(updated)
    upsert_from_stripe_subscription(
        db,
        user_id=user_id,
        stripe_customer_id=parsed.get("stripe_customer_id"),
        stripe_subscription_id=parsed.get("stripe_subscription_id"),
        status=parsed.get("status") or "none",
        plan_id=parsed.get("plan_id"),
        interval=parsed.get("interval"),
        current_period_end=parsed.get("current_period_end"),
        cancel_at_period_end=parsed.get("cancel_at_period_end", False),
    )

def create_portal_session(
    db: Session,
    settings: Settings,
    *,
    user_id: UUID,
) -> str:
    _configure_stripe(settings)
    row = get_entitlement(db, user_id)
    if not row or not row.stripe_customer_id:
        raise ValueError("No Stripe customer found for this user")

    return_url = settings.stripe_customer_portal_return_url
    if not return_url:
        raise BillingNotConfiguredError(
            "STRIPE_CUSTOMER_PORTAL_RETURN_URL is not configured"
        )

    session = stripe.billing_portal.Session.create(
        customer=row.stripe_customer_id,
        return_url=return_url,
    )
    url = session.get("url")
    if not url:
        raise RuntimeError("Stripe portal session did not return a URL")
    return url

def _find_active_subscription_for_customer(
    settings: Settings,
    customer_id: str,
) -> Optional[dict[str, Any]]:
    """Return the customer's current Stripe subscription, if any grants access."""
    _configure_stripe(settings)
    for status in ("active", "trialing", "past_due"):
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status=status,
            limit=10,
        )
        if subscriptions.data:
            return subscriptions.data[0]
    return None

def reconcile_entitlement_with_stripe(
    db: Session,
    settings: Settings,
    user_id: UUID,
) -> None:
    """
    Make the local entitlement match Stripe (source of truth).

    Fixes missed webhooks in both directions:
    - upgrade: Stripe has an active sub the DB has not recorded yet, and
    - downgrade: the DB still shows premium but Stripe has no active sub.
    """
    try:
        _require_stripe_config(settings)
    except BillingNotConfiguredError:
        return

    row = get_entitlement(db, user_id)
    if not row or not row.stripe_customer_id:
        return

    subscription = _find_active_subscription_for_customer(
        settings,
        row.stripe_customer_id,
    )

    if subscription is not None:
        parsed = parse_subscription_record(subscription)
        upsert_from_stripe_subscription(
            db,
            user_id=user_id,
            stripe_customer_id=parsed.get("stripe_customer_id"),
            stripe_subscription_id=parsed.get("stripe_subscription_id"),
            status=parsed.get("status") or "none",
            plan_id=parsed.get("plan_id"),
            interval=parsed.get("interval"),
            current_period_end=parsed.get("current_period_end"),
            cancel_at_period_end=parsed.get("cancel_at_period_end", False),
        )
        return

    if row_grants_premium(row):
        _mark_entitlement_canceled_locally(db, user_id)

def get_customer_credit_balance(
    db: Session,
    settings: Settings,
    user_id: UUID,
) -> tuple[int, Optional[str]]:
    """
    Return (available_credit_cents, currency) from the Stripe customer balance.

    Stripe stores unused credit as a negative customer balance; expose it as a
    positive amount so the UI can show "you have credit applied to future
    invoices". Returns (0, None) when Stripe is unconfigured or unavailable.
    """
    try:
        _require_stripe_config(settings)
    except BillingNotConfiguredError:
        return 0, None

    row = get_entitlement(db, user_id)
    if not row or not row.stripe_customer_id:
        return 0, None

    _configure_stripe(settings)
    try:
        customer = stripe.Customer.retrieve(row.stripe_customer_id)
    except Exception as exc:
        logger.warning(
            "Failed to fetch credit balance for user %s: %s",
            user_id,
            exc,
        )
        return 0, None

    balance = customer.get("balance") or 0
    credit = -balance if balance < 0 else 0
    return credit, customer.get("currency")

def construct_webhook_event(
    settings: Settings,
    payload: bytes,
    signature: Optional[str],
) -> Any:
    if not settings.stripe_webhook_secret:
        raise BillingNotConfiguredError("STRIPE_WEBHOOK_SECRET is not configured")
    return stripe.Webhook.construct_event(
        payload,
        signature,
        settings.stripe_webhook_secret,
    )

def handle_subscription_event(
    db: Session,
    settings: Settings,
    subscription: dict[str, Any],
) -> None:
    parsed = parse_subscription_record(subscription)
    user_id = parsed.get("user_id")
    if not user_id:
        return

    upsert_from_stripe_subscription(
        db,
        user_id=user_id,
        stripe_customer_id=parsed.get("stripe_customer_id"),
        stripe_subscription_id=parsed.get("stripe_subscription_id"),
        status=parsed.get("status") or "none",
        plan_id=parsed.get("plan_id"),
        interval=parsed.get("interval"),
        current_period_end=parsed.get("current_period_end"),
        cancel_at_period_end=parsed.get("cancel_at_period_end", False),
    )

    status = parsed.get("status")
    customer_id = parsed.get("stripe_customer_id")
    subscription_id = parsed.get("stripe_subscription_id")
    if (
        customer_id
        and subscription_id
        and status in ("active", "trialing", "past_due")
    ):
        _cancel_other_active_subscriptions(
            settings,
            customer_id,
            subscription_id,
        )

def handle_checkout_completed(
    db: Session,
    settings: Settings,
    session: dict[str, Any],
) -> None:
    metadata = session.get("metadata") or {}
    user_id_raw = metadata.get("supabase_user_id") or session.get("client_reference_id")
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    if not user_id_raw:
        return

    user_id = UUID(user_id_raw)
    row = get_or_create_entitlement(db, user_id)
    if customer_id:
        row.stripe_customer_id = customer_id
    if subscription_id:
        row.stripe_subscription_id = subscription_id
        row.status = "active"
        row.cancel_at_period_end = False
    if metadata.get("plan_id"):
        row.plan_id = metadata.get("plan_id")
    if metadata.get("interval"):
        row.interval = metadata.get("interval")
    db.add(row)
    db.commit()

    if customer_id and subscription_id:
        _cancel_other_active_subscriptions(
            settings,
            customer_id,
            subscription_id,
        )

def process_webhook_event(db: Session, settings: Settings, event: Any) -> None:
    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        handle_checkout_completed(db, settings, data_object)
        return

    if event_type.startswith("customer.subscription."):
        handle_subscription_event(db, settings, data_object)
