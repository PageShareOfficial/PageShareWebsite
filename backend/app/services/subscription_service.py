"""Read and upsert user subscription entitlements."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user_entitlement import UserEntitlement
from app.schemas.billing import BillingStatusResponse
from app.services.billing_constants import (
    STALE_SUBSCRIPTION_STATUSES,
    compute_past_due_grace_ends_at,
    is_premium_entitlement,
    normalize_interval,
    normalize_plan_id,
)

def get_entitlement(db: Session, user_id: UUID) -> Optional[UserEntitlement]:
    return db.get(UserEntitlement, user_id)

def get_or_create_entitlement(db: Session, user_id: UUID) -> UserEntitlement:
    row = get_entitlement(db, user_id)
    if row:
        return row

    row = UserEntitlement(user_id=user_id, status="none")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def row_grants_premium(
    row: UserEntitlement,
    *,
    now: Optional[datetime] = None,
) -> bool:
    return is_premium_entitlement(
        row.status,
        row.past_due_grace_ends_at,
        now=now,
    )

def entitlement_matches_checkout(
    row: Optional[UserEntitlement],
    plan_id: str,
    interval: str,
) -> bool:
    """True when the user already has premium on this exact plan and interval."""
    if not row:
        return False
    return (
        row_grants_premium(row)
        and normalize_plan_id(row.plan_id) == normalize_plan_id(plan_id)
        and normalize_interval(row.interval) == normalize_interval(interval)
    )

def entitlement_to_status(row: Optional[UserEntitlement]) -> BillingStatusResponse:
    if not row:
        return BillingStatusResponse(
            is_premium=False,
            plan_id=None,
            status="none",
            interval=None,
            current_period_end=None,
            cancel_at_period_end=False,
            past_due_grace_ends_at=None,
        )

    plan_id = normalize_plan_id(row.plan_id)
    interval = normalize_interval(row.interval)
    status = row.status if row.status in {
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "none",
    } else "none"

    return BillingStatusResponse(
        is_premium=row_grants_premium(row),
        plan_id=plan_id,
        status=status,  # type: ignore[arg-type]
        interval=interval,
        current_period_end=row.current_period_end,
        cancel_at_period_end=bool(getattr(row, "cancel_at_period_end", False)),
        past_due_grace_ends_at=row.past_due_grace_ends_at,
    )

def get_billing_status(db: Session, user_id: UUID) -> BillingStatusResponse:
    return entitlement_to_status(get_entitlement(db, user_id))

def is_premium_user(db: Session, user_id: UUID) -> bool:
    row = get_entitlement(db, user_id)
    if not row:
        return False
    return row_grants_premium(row)

def get_user_plan_id(db: Session, user_id: UUID) -> Optional[str]:
    row = get_entitlement(db, user_id)
    if not row or not row_grants_premium(row):
        return None
    return normalize_plan_id(row.plan_id)

def get_active_plan_ids_for_users(
    db: Session, user_ids: List[UUID]
) -> Dict[UUID, str]:
    if not user_ids:
        return {}

    rows = (
        db.query(UserEntitlement)
        .filter(UserEntitlement.user_id.in_(user_ids))
        .all()
    )
    plan_map: Dict[UUID, str] = {}
    for row in rows:
        if not row_grants_premium(row):
            continue
        plan_id = normalize_plan_id(row.plan_id)
        if plan_id:
            plan_map[row.user_id] = plan_id
    return plan_map

def _epoch_to_datetime(epoch: Optional[int]) -> Optional[datetime]:
    if epoch is None:
        return None
    return datetime.fromtimestamp(epoch, tz=timezone.utc)

def _apply_grace_on_status_change(
    row: UserEntitlement,
    new_status: str,
) -> None:
    if new_status == "past_due":
        if row.past_due_grace_ends_at is None:
            row.past_due_grace_ends_at = compute_past_due_grace_ends_at()
        return

    if new_status in ("active", "trialing"):
        row.past_due_grace_ends_at = None
        return

    if new_status in ("canceled", "incomplete", "none"):
        row.past_due_grace_ends_at = None

def should_apply_subscription_webhook(
    row: UserEntitlement,
    incoming_subscription_id: Optional[str],
    incoming_status: str,
) -> bool:
    """
    Ignore terminal webhooks for subscriptions we are not tracking.
    Prevents a canceled analyst sub from overwriting a new investor sub when
    stripe_subscription_id was cleared locally during a plan switch.
    """
    if not incoming_subscription_id:
        return True
    if incoming_subscription_id == row.stripe_subscription_id:
        return True
    if incoming_status in STALE_SUBSCRIPTION_STATUSES:
        return False
    return True

def upsert_from_stripe_subscription(
    db: Session,
    *,
    user_id: UUID,
    stripe_customer_id: Optional[str],
    stripe_subscription_id: Optional[str],
    status: str,
    plan_id: Optional[str],
    interval: Optional[str],
    current_period_end: Optional[int],
    cancel_at_period_end: bool = False,
) -> UserEntitlement:
    row = get_or_create_entitlement(db, user_id)
    if not should_apply_subscription_webhook(
        row,
        stripe_subscription_id,
        status or "none",
    ):
        return row

    if stripe_customer_id:
        row.stripe_customer_id = stripe_customer_id
    if stripe_subscription_id:
        row.stripe_subscription_id = stripe_subscription_id

    new_status = status or "none"
    _apply_grace_on_status_change(row, new_status)
    row.status = new_status

    # Keep plan details while access is (or may still be) granted; otherwise
    # revert to a Free-like row so a canceled sub never leaks stale plan/period.
    if new_status in ("active", "trialing", "past_due"):
        row.plan_id = normalize_plan_id(plan_id)
        row.interval = normalize_interval(interval)
        # Some Stripe events omit the period; keep the known value instead of
        # nulling it (e.g. a cancel-at-period-end update should preserve it).
        if current_period_end is not None:
            row.current_period_end = _epoch_to_datetime(current_period_end)
        row.cancel_at_period_end = bool(cancel_at_period_end)
    else:
        row.plan_id = None
        row.interval = None
        row.current_period_end = None
        row.cancel_at_period_end = False
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def parse_subscription_record(subscription: dict[str, Any]) -> dict[str, Any]:
    """Extract entitlement fields from a Stripe subscription object."""
    metadata = subscription.get("metadata") or {}
    items = subscription.get("items", {}).get("data") or []
    price = items[0].get("price", {}) if items else {}
    recurring = price.get("recurring") or {}

    interval = metadata.get("interval") or recurring.get("interval")
    if interval == "year":
        interval = "yearly"
    elif interval == "month":
        interval = "monthly"

    # Stripe's newer API versions expose current_period_end on the subscription
    # item rather than the top-level subscription, so fall back to the item.
    item = items[0] if items else {}
    current_period_end = subscription.get("current_period_end")
    if current_period_end is None:
        current_period_end = item.get("current_period_end")

    user_id_raw = metadata.get("supabase_user_id")
    return {
        "user_id": UUID(user_id_raw) if user_id_raw else None,
        "stripe_customer_id": subscription.get("customer"),
        "stripe_subscription_id": subscription.get("id"),
        "status": subscription.get("status") or "none",
        "plan_id": metadata.get("plan_id"),
        "interval": interval,
        "current_period_end": current_period_end,
        "cancel_at_period_end": bool(subscription.get("cancel_at_period_end", False)),
    }
