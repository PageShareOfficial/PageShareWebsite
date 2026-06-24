"""Billing: subscription status, Stripe Checkout, Portal, webhooks."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.config import Settings, get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.billing import (
    BillingStatusResponse,
    CheckoutSessionResponse,
    CreateCheckoutSessionRequest,
    PortalSessionResponse,
)
from app.schemas.billing import CheckoutSessionBody
from app.services.auth_service import CurrentUser
from app.services.billing_service import (
    BillingNotConfiguredError,
    construct_webhook_event,
    create_checkout_session,
    create_portal_session,
    process_webhook_event,
)
from app.utils.rate_limit import is_rate_limited
from app.services.subscription_service import get_billing_status
from app.services.user_service import get_or_create_user_for_auth

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/status", response_model=BillingStatusResponse)
def billing_status(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = UUID(current_user.auth_user_id)
    return get_billing_status(db, user_id)

@router.post("/checkout", response_model=CheckoutSessionResponse)
def billing_checkout(
    body: CreateCheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    user_id = UUID(current_user.auth_user_id)
    if is_rate_limited(f"billing:checkout:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many checkout requests. Please try again shortly.",
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
    except BillingNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return CheckoutSessionResponse(url=url)

@router.post("/portal", response_model=PortalSessionResponse)
def billing_portal(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    user_id = UUID(current_user.auth_user_id)
    if is_rate_limited(f"billing:portal:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many portal requests. Please try again shortly.",
        )

    try:
        url = create_portal_session(db, settings, user_id=user_id)
    except BillingNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

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

    process_webhook_event(db, event)
    return {"received": True}
