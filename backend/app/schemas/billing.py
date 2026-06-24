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


class CreateCheckoutSessionRequest(BaseModel):
    plan_id: PlanId
    interval: BillingInterval
    success_url: HttpUrl
    cancel_url: HttpUrl


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
