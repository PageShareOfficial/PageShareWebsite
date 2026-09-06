"""Billing: subscription status, Stripe Checkout, Portal, webhooks."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.billing_http import (
    CHECKOUT_ERROR_STATUS,
    PORTAL_ERROR_STATUS,
    SWITCH_ERROR_STATUS,
    raise_billing_http,
    reject_if_rate_limited,
)
from app.config import Settings, get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.billing import (
    BillingStatusResponse,
    CheckoutSessionBody,
    CheckoutSessionResponse,
    CreateCheckoutSessionRequest,
    PortalSessionResponse,
    SwitchPlanRequest,
)
from app.services.auth_service import CurrentUser
from app.services.billing_service import (
    BillingNotConfiguredError,
    construct_webhook_event,
    create_checkout_session,
    create_portal_session,
    get_customer_credit_balance,
    process_webhook_event,
    reconcile_entitlement_with_stripe,
    switch_subscription_plan,
)
from app.services.subscription_service import get_billing_status
from app.services.user_service import get_or_create_user_for_auth

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/status", response_model=BillingStatusResponse)
def billing_status(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    user_id = UUID(current_user.auth_user_id)
    reconcile_entitlement_with_stripe(db, settings, user_id)
    status_response = get_billing_status(db, user_id)
    credit_balance, currency = get_customer_credit_balance(db, settings, user_id)
    status_response.credit_balance = credit_balance
    status_response.currency = currency
    return status_response

@router.post("/checkout", response_model=CheckoutSessionResponse)
def billing_checkout(
    body: CreateCheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    user_id = UUID(current_user.auth_user_id)
    reject_if_rate_limited(
        f"billing:checkout:{user_id}",
        "Too many checkout requests. Please try again shortly.",
    )
    get_or_create_user_for_auth(db, current_user)
    email = current_user.claims.get("email")

    try:
        url = create_checkout_session(
            db,
            settings,
            user_id=user_id,
            body=CheckoutSessionBody(
                plan_id=body.plan_id,
                interval=body.interval,
                success_url=str(body.success_url),
                cancel_url=str(body.cancel_url),
            ),
            email=email,
        )
    except Exception as exc:
        raise_billing_http(exc, CHECKOUT_ERROR_STATUS)

    return CheckoutSessionResponse(url=url)

@router.post("/switch", response_model=BillingStatusResponse)
def billing_switch(
    body: SwitchPlanRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Switch an active subscription to another plan/interval with proration."""
    user_id = UUID(current_user.auth_user_id)
    reject_if_rate_limited(
        f"billing:switch:{user_id}",
        "Too many plan changes. Please try again shortly.",
    )

    try:
        switch_subscription_plan(
            db,
            settings,
            user_id=user_id,
            plan_id=body.plan_id,
            interval=body.interval,
        )
    except Exception as exc:
        raise_billing_http(exc, SWITCH_ERROR_STATUS)

    return get_billing_status(db, user_id)

@router.post("/portal", response_model=PortalSessionResponse)
def billing_portal(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    user_id = UUID(current_user.auth_user_id)
    reject_if_rate_limited(
        f"billing:portal:{user_id}",
        "Too many portal requests. Please try again shortly.",
    )

    try:
        url = create_portal_session(db, settings, user_id=user_id)
    except Exception as exc:
        raise_billing_http(exc, PORTAL_ERROR_STATUS)

    return PortalSessionResponse(url=url)

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def billing_webhook(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = construct_webhook_event(settings, payload, signature)
    except BillingNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature",
        ) from exc

    process_webhook_event(db, settings, event)
    return {"received": True}
