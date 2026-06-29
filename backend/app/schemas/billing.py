"""Billing request/response schemas (matches frontend billingApi.ts)."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl

PlanId = Literal["analyst", "investor"]
BillingInterval = Literal["monthly", "yearly"]
SubscriptionStatus = Literal[
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "none",
]


class BillingStatusResponse(BaseModel):
    is_premium: bool
    plan_id: Optional[PlanId] = None
    status: SubscriptionStatus = "none"
    interval: Optional[BillingInterval] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    past_due_grace_ends_at: Optional[datetime] = None
    # Available account credit (e.g. from a downgrade), in the smallest currency
    # unit (cents). Positive means credit that auto-applies to future invoices.
    credit_balance: int = 0
    currency: Optional[str] = None


class CreateCheckoutSessionRequest(BaseModel):
    plan_id: PlanId
    interval: BillingInterval
    success_url: HttpUrl
    cancel_url: HttpUrl


class SwitchPlanRequest(BaseModel):
    """Switch an existing active subscription to a new plan/interval in place."""

    plan_id: PlanId
    interval: BillingInterval


class CheckoutSessionResponse(BaseModel):
    url: str


class PortalSessionResponse(BaseModel):
    url: str


class CheckoutSessionBody(BaseModel):
    """Validated checkout payload with string URLs for Stripe SDK."""

    plan_id: PlanId
    interval: BillingInterval
    success_url: str = Field(min_length=1)
    cancel_url: str = Field(min_length=1)
