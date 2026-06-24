"""Read and upsert user subscription entitlements."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user_entitlement import UserEntitlement
from app.schemas.billing import BillingStatusResponse
from app.services.billing_constants import (
    is_premium_status,
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

def entitlement_to_status(row: Optional[UserEntitlement]) -> BillingStatusResponse:
    if not row:
        return BillingStatusResponse(
            is_premium=False,
            plan_id=None,
            status="none",
            interval=None,
            current_period_end=None,
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
        is_premium=is_premium_status(status),
        plan_id=plan_id,
        status=status,  # type: ignore[arg-type]
        interval=interval,
        current_period_end=row.current_period_end,
    )

def get_billing_status(db: Session, user_id: UUID) -> BillingStatusResponse:
    return entitlement_to_status(get_entitlement(db, user_id))

def is_premium_user(db: Session, user_id: UUID) -> bool:
    return get_billing_status(db, user_id).is_premium

def get_user_plan_id(db: Session, user_id: UUID) -> Optional[str]:
    row = get_entitlement(db, user_id)
    if not row or not is_premium_status(row.status):
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
        if not is_premium_status(row.status):
            continue
        plan_id = normalize_plan_id(row.plan_id)
        if plan_id:
            plan_map[row.user_id] = plan_id
    return plan_map

def _epoch_to_datetime(epoch: Optional[int]) -> Optional[datetime]:
    if epoch is None:
        return None
    return datetime.fromtimestamp(epoch, tz=timezone.utc)

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
) -> UserEntitlement:
    row = get_or_create_entitlement(db, user_id)
    if stripe_customer_id:
        row.stripe_customer_id = stripe_customer_id
    if stripe_subscription_id:
        row.stripe_subscription_id = stripe_subscription_id
    row.status = status or "none"
    row.plan_id = normalize_plan_id(plan_id)
    row.interval = normalize_interval(interval)
    row.current_period_end = _epoch_to_datetime(current_period_end)
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

    user_id_raw = metadata.get("supabase_user_id")
    return {
        "user_id": UUID(user_id_raw) if user_id_raw else None,
        "stripe_customer_id": subscription.get("customer"),
        "stripe_subscription_id": subscription.get("id"),
        "status": subscription.get("status") or "none",
        "plan_id": metadata.get("plan_id"),
        "interval": interval,
        "current_period_end": subscription.get("current_period_end"),
    }
