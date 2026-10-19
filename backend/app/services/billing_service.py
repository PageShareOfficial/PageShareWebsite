"""Stripe Checkout, Portal, and webhook handling."""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Optional
from uuid import UUID
import stripe
from sqlalchemy.orm import Session
from app.config import Settings
from app.schemas.billing import CheckoutSessionBody
from app.services.holiday_sale import active_sale_phase, sale_promotion_codes
from app.services.billing_constants import (
    CROSS_PLAN_SWITCH_MESSAGE,
    INTERVAL_MONTHLY,
    INTERVAL_YEARLY,
    PLAN_ID_ANALYST,
    PLAN_ID_INVESTOR,
    normalize_plan_id,
    resolve_stripe_price_id,
)
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


class PlanTypeChangeNotAllowedError(Exception):
    """Raised when a subscriber tries to move between Analyst and Investor."""


def _assert_plan_type_unchanged(row, target_plan_id: str) -> None:
    """Premium subscribers may only change interval within the same plan type."""
    if not row or not row_grants_premium(row):
        return
    current_plan = normalize_plan_id(row.plan_id)
    target_plan = normalize_plan_id(target_plan_id)
    if current_plan and target_plan and current_plan != target_plan:
        raise PlanTypeChangeNotAllowedError(CROSS_PLAN_SWITCH_MESSAGE)

def _require_stripe_config(settings: Settings) -> None:
    if not settings.stripe_secret_key:
        raise BillingNotConfiguredError("STRIPE_SECRET_KEY is not configured")

def build_price_map(settings: Settings) -> dict[tuple[str, str], str]:
    return {
        (PLAN_ID_ANALYST, INTERVAL_MONTHLY): settings.stripe_price_id_analyst_monthly,
        (PLAN_ID_ANALYST, INTERVAL_YEARLY): settings.stripe_price_id_analyst_yearly,
        (PLAN_ID_INVESTOR, INTERVAL_MONTHLY): settings.stripe_price_id_investor_monthly,
        (PLAN_ID_INVESTOR, INTERVAL_YEARLY): settings.stripe_price_id_investor_yearly,
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

def _checkout_session_has_tax_collection(session: Any) -> bool:
    """True when the session was created with automatic tax + optional tax ID."""
    automatic_tax = session.get("automatic_tax") or {}
    tax_id_collection = session.get("tax_id_collection") or {}
    return (
        automatic_tax.get("enabled") is True
        and tax_id_collection.get("enabled") is True
    )

def _session_sale_code(session: Any) -> str:
    metadata = session.get("metadata") or {}
    return str(metadata.get("sale_code") or "")

def _find_open_checkout_session_url(
    settings: Settings,
    customer_id: str,
    plan_id: str,
    interval: str,
    sale_code: str,
) -> Optional[str]:
    """Reuse an in-flight Checkout session so double-clicks are idempotent.

    Skips older open sessions that lack tax collection, and sessions from a
    different sale phase, so the buyer is not sent through a stale price.
    """
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
        if not _checkout_session_has_tax_collection(session):
            continue
        if _session_sale_code(session) != sale_code:
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

@dataclass(frozen=True)
class CheckoutSale:
    """Active phase whose Stripe promotion code was found."""

    code: str
    promotion_code_id: str

def _stripe_field(item: Any, name: str) -> Any:
    if item is None:
        return None
    if isinstance(item, dict):
        return item.get(name)
    return getattr(item, name, None)

def _promotion_id(item: Any) -> Optional[str]:
    value = _stripe_field(item, "id")
    return str(value) if value else None

def lookup_active_promotion_code_id(settings: Settings, code: str) -> Optional[str]:
    """Stripe id for an active promotion code, or None when it is not redeemable."""
    _configure_stripe(settings)
    try:
        found = stripe.PromotionCode.list(code=code, active=True, limit=1)
    except stripe.StripeError as exc:
        logger.error("Promotion code lookup failed for %s: %s", code, exc)
        return None
    matches = list(getattr(found, "data", []) or [])
    if not matches:
        logger.warning("No active promotion code %s", code)
        return None
    return _promotion_id(matches[0])

def _stripe_list(found: Any) -> list[Any]:
    return list(getattr(found, "data", []) or [])

def _promotion_code_text(value: Any) -> str:
    if value is None or isinstance(value, str):
        return ""
    return str(_stripe_field(value, "code") or "").upper()

def _item_discounts(item: Any) -> list[Any]:
    many = list(_stripe_field(item, "discounts") or [])
    single = _stripe_field(item, "discount")
    if single is not None:
        many.append(single)
    return many

def _has_sale_code(items: list[Any], codes: set[str]) -> bool:
    for item in items:
        for discount in _item_discounts(item):
            code = _promotion_code_text(_stripe_field(discount, "promotion_code"))
            if code in codes:
                return True
    return False

_SALE_CODE_EXPAND = [
    "data.discount.promotion_code",
    "data.discounts.promotion_code",
]

def _load_customer_history(customer_id: str) -> tuple[list[Any], list[Any]]:
    invoices = _stripe_list(
        stripe.Invoice.list(customer=customer_id, limit=100, expand=_SALE_CODE_EXPAND)
    )
    subscriptions = _stripe_list(
        stripe.Subscription.list(
            customer=customer_id,
            status="all",
            limit=100,
            expand=_SALE_CODE_EXPAND,
        )
    )
    return invoices, subscriptions

def _has_paid_invoice(invoices: list[Any]) -> bool:
    return any(
        int(_stripe_field(invoice, "amount_paid") or 0) > 0 for invoice in invoices
    )

def _has_live_subscription(subscriptions: list[Any]) -> bool:
    live_statuses = {"active", "trialing", "past_due"}
    return any(_stripe_field(sub, "status") in live_statuses for sub in subscriptions)

def customer_can_redeem_sale(settings: Settings, customer_id: str) -> bool:
    """One sale code per customer. A canceled customer does not get another."""
    _configure_stripe(settings)
    try:
        invoices, subscriptions = _load_customer_history(customer_id)
    except stripe.StripeError as exc:
        logger.error("Sale eligibility check failed for %s: %s", customer_id, exc)
        return False
    codes = {code.upper() for code in sale_promotion_codes()}
    if _has_sale_code(invoices, codes) or _has_sale_code(subscriptions, codes):
        return False
    canceled = _has_paid_invoice(invoices) and not _has_live_subscription(subscriptions)
    return not canceled

def sale_redeemable_for_user(db: Session, settings: Settings, user_id: UUID) -> bool:
    """True when this account can still receive one sale code."""
    row = get_entitlement(db, user_id)
    customer_id = row.stripe_customer_id if row is not None else None
    if not customer_id:
        return True
    return customer_can_redeem_sale(settings, customer_id)

def resolve_checkout_sale(
    settings: Settings,
    customer_id: str,
    now: Optional[datetime] = None,
) -> Optional[CheckoutSale]:
    """The sale to attach. None when the phase, the code, or the customer is ineligible."""
    phase = active_sale_phase(now or datetime.now(timezone.utc))
    if phase is None or not customer_can_redeem_sale(settings, customer_id):
        return None
    promotion_code_id = lookup_active_promotion_code_id(settings, phase.code)
    if not promotion_code_id:
        return None
    return CheckoutSale(code=phase.code, promotion_code_id=promotion_code_id)

def _checkout_metadata(user_id: UUID, body: CheckoutSessionBody, sale_code: str) -> dict:
    metadata = {
        "supabase_user_id": str(user_id),
        "plan_id": body.plan_id,
        "interval": body.interval,
    }
    if sale_code:
        metadata["sale_code"] = sale_code
    return metadata

def _checkout_create_params(
    user_id: UUID,
    body: CheckoutSessionBody,
    customer_id: str,
    price_id: str,
    sale: Optional[CheckoutSale],
) -> dict:
    sale_code = sale.code if sale else ""
    metadata = _checkout_metadata(user_id, body, sale_code)
    params: dict[str, Any] = {
        "mode": "subscription",
        "customer": customer_id,
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": body.success_url,
        "cancel_url": body.cancel_url,
        "client_reference_id": str(user_id),
        "billing_address_collection": "required",
        "automatic_tax": {"enabled": True},
        "tax_id_collection": {"enabled": True},
        "customer_update": {"address": "auto", "name": "auto"},
        "metadata": metadata,
        "subscription_data": {"metadata": dict(metadata)},
    }
    if sale is not None:
        params["discounts"] = [{"promotion_code": sale.promotion_code_id}]
    return params

def _is_promotion_rejection(exc: stripe.InvalidRequestError) -> bool:
    text = str(exc).lower()
    return "promotion" in text or "coupon" in text

def _without_sale(params: dict) -> dict:
    metadata = dict(params.get("metadata") or {})
    metadata.pop("sale_code", None)
    retried = {**params, "metadata": metadata}
    retried.pop("discounts", None)
    if "subscription_data" not in params:
        return retried
    subscription_data = dict(params.get("subscription_data") or {})
    sub_metadata = dict(subscription_data.get("metadata") or {})
    sub_metadata.pop("sale_code", None)
    subscription_data["metadata"] = sub_metadata
    retried["subscription_data"] = subscription_data
    return retried

def _call_with_sale_fallback(call: Callable[..., Any], params: dict) -> Any:
    """Run a Stripe call. A rejected sale code is retried at the list price."""
    try:
        return call(**params)
    except stripe.InvalidRequestError as exc:
        if "discounts" not in params or not _is_promotion_rejection(exc):
            raise
        logger.warning("Sale promotion code rejected: %s", exc)
        return call(**_without_sale(params))

def _create_stripe_checkout(params: dict) -> Any:
    """Create Checkout. A rejected sale code falls back to the list price."""
    return _call_with_sale_fallback(stripe.checkout.Session.create, params)

def _modify_subscription(subscription_id: str, params: dict) -> Any:
    """Apply a plan change. A rejected sale code falls back to the list price."""
    def modify(**modify_params: Any) -> Any:
        return stripe.Subscription.modify(subscription_id, **modify_params)

    try:
        return _call_with_sale_fallback(modify, params)
    except stripe.CardError as exc:
        raise PaymentFailedError(
            "Your card was declined for the plan change. "
            "Update your payment method and try again."
        ) from exc

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
    _assert_plan_type_unchanged(row, body.plan_id)

    customer_id = get_or_create_stripe_customer(db, settings, user_id, email)
    sale = resolve_checkout_sale(settings, customer_id)
    sale_code = sale.code if sale else ""

    existing_url = _find_open_checkout_session_url(
        settings,
        customer_id,
        body.plan_id,
        body.interval,
        sale_code,
    )
    if existing_url:
        return existing_url

    if not entitlement_matches_checkout(row, body.plan_id, body.interval):
        cancel_existing_subscription_for_checkout(db, settings, user_id)

    # No Stripe idempotency key: double-click protection is the open-session
    # reuse above, and a static key collides when the customer or URLs change.
    session = _create_stripe_checkout(
        _checkout_create_params(user_id, body, customer_id, price_id, sale)
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
    _assert_plan_type_unchanged(row, plan_id)
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

    sale = resolve_checkout_sale(settings, row.stripe_customer_id)
    modify_params: dict[str, Any] = {
        "items": [{"id": items[0]["id"], "price": new_price_id}],
        "proration_behavior": "always_invoice",
        "payment_behavior": "error_if_incomplete",
        "cancel_at_period_end": False,
        "metadata": {
            "supabase_user_id": str(user_id),
            "plan_id": plan_id,
            "interval": interval,
        },
    }
    if sale is not None:
        modify_params["discounts"] = [{"promotion_code": sale.promotion_code_id}]
    updated = _modify_subscription(subscription["id"], modify_params)

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
