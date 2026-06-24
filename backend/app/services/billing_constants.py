"""Pure billing helpers (no Stripe SDK) — easy to unit test."""

from typing import Literal, Optional, Tuple

PlanId = Literal["analyst", "investor"]
BillingInterval = Literal["monthly", "yearly"]

PREMIUM_STATUSES = frozenset({"active", "trialing"})
VALID_PLAN_IDS = frozenset({"analyst", "investor"})
VALID_INTERVALS = frozenset({"monthly", "yearly"})

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
    """True when subscription status grants premium access."""
    if not status:
        return False
    return status in PREMIUM_STATUSES

def normalize_plan_id(value: Optional[str]) -> Optional[PlanId]:
    if value in VALID_PLAN_IDS:
        return value  # type: ignore[return-value]
    return None

def normalize_interval(value: Optional[str]) -> Optional[BillingInterval]:
    if value in VALID_INTERVALS:
        return value  # type: ignore[return-value]
    return None
