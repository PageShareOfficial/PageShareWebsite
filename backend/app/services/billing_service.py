"""Stripe Checkout, Portal, and webhook handling."""

from typing import Any, Optional
from uuid import UUID
import stripe
from sqlalchemy.orm import Session
from app.config import Settings
from app.schemas.billing import CheckoutSessionBody
from app.services.billing_constants import resolve_stripe_price_id
from app.services.subscription_service import (
    get_entitlement,
    get_or_create_entitlement,
    parse_subscription_record,
    upsert_from_stripe_subscription,
)

class BillingNotConfiguredError(Exception):
    """Raised when required Stripe env vars are missing."""

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
    customer_id = get_or_create_stripe_customer(db, settings, user_id, email)

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

def handle_subscription_event(db: Session, subscription: dict[str, Any]) -> None:
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
    )

def handle_checkout_completed(db: Session, session: dict[str, Any]) -> None:
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
    if metadata.get("plan_id"):
        row.plan_id = metadata.get("plan_id")
    if metadata.get("interval"):
        row.interval = metadata.get("interval")
    db.add(row)
    db.commit()

def process_webhook_event(db: Session, event: Any) -> None:
    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        handle_checkout_completed(db, data_object)
        return

    if event_type.startswith("customer.subscription."):
        handle_subscription_event(db, data_object)
