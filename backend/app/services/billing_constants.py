"""Pure billing helpers (no Stripe SDK) — easy to unit test."""

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, Tuple

PlanId = Literal["analyst", "investor"]
BillingInterval = Literal["monthly", "yearly"]

PLAN_ID_ANALYST = "analyst"
PLAN_ID_INVESTOR = "investor"
INTERVAL_MONTHLY = "monthly"
INTERVAL_YEARLY = "yearly"

PREMIUM_STATUSES = frozenset({"active", "trialing"})
CANCELABLE_STATUSES = frozenset({"active", "trialing", "past_due"})
STALE_SUBSCRIPTION_STATUSES = frozenset({
    "canceled",
    "incomplete",
    "incomplete_expired",
    "unpaid",
})
VALID_PLAN_IDS = frozenset({PLAN_ID_ANALYST, PLAN_ID_INVESTOR})
VALID_INTERVALS = frozenset({INTERVAL_MONTHLY, INTERVAL_YEARLY})
PAST_DUE_GRACE_DAYS = 7

def resolve_stripe_price_id(
    plan_id: str,
    interval: str,
    price_map: dict[Tuple[str, str], str],
) -> str:
    """Map (plan_id, interval) to a configured Stripe Price ID."""
    if plan_id not in VALID_PLAN_IDS:
        raise ValueError(f"Invalid plan_id: {plan_id}")
    if interval not in VALID_INTERVALS:
        raise ValueError(f"Invalid interval: {interval}")

    price_id = price_map.get((plan_id, interval), "").strip()
    if not price_id:
        raise ValueError(
            f"Stripe price not configured for plan_id={plan_id}, interval={interval}"
        )
    return price_id

def is_premium_status(status: Optional[str]) -> bool:
    """True when subscription status grants premium access (active/trialing only)."""
    if not status:
        return False
    return status in PREMIUM_STATUSES

def is_cancelable_subscription_status(status: Optional[str]) -> bool:
    if not status:
        return False
    return status in CANCELABLE_STATUSES


def compute_past_due_grace_ends_at(
    *,
    now: Optional[datetime] = None,
) -> datetime:
    moment = now or datetime.now(timezone.utc)
    return moment + timedelta(days=PAST_DUE_GRACE_DAYS)

def is_premium_entitlement(
    status: Optional[str],
    past_due_grace_ends_at: Optional[datetime],
    *,
    now: Optional[datetime] = None,
) -> bool:
    """Premium if active/trialing, or past_due within the grace window."""
    if is_premium_status(status):
        return True
    if status != "past_due" or past_due_grace_ends_at is None:
        return False

    moment = now or datetime.now(timezone.utc)
    grace_end = past_due_grace_ends_at
    if grace_end.tzinfo is None:
        grace_end = grace_end.replace(tzinfo=timezone.utc)
    return moment < grace_end

def normalize_plan_id(value: Optional[str]) -> Optional[PlanId]:
    if value in VALID_PLAN_IDS:
        return value  # type: ignore[return-value]
    return None

def normalize_interval(value: Optional[str]) -> Optional[BillingInterval]:
    if value in VALID_INTERVALS:
        return value  # type: ignore[return-value]
    return None
