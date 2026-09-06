"""Map billing domain errors to HTTPException responses."""
from typing import Mapping, NoReturn, Type
from fastapi import HTTPException, status
from app.services.billing_service import (
    AlreadySubscribedError,
    BillingNotConfiguredError,
    NoActiveSubscriptionError,
    PaymentFailedError,
    PlanTypeChangeNotAllowedError,
)

ExceptionStatusMap = Mapping[Type[BaseException], int]

CHECKOUT_ERROR_STATUS: ExceptionStatusMap = {
    BillingNotConfiguredError: status.HTTP_503_SERVICE_UNAVAILABLE,
    AlreadySubscribedError: status.HTTP_409_CONFLICT,
    PlanTypeChangeNotAllowedError: status.HTTP_409_CONFLICT,
    ValueError: status.HTTP_400_BAD_REQUEST,
}

SWITCH_ERROR_STATUS: ExceptionStatusMap = {
    BillingNotConfiguredError: status.HTTP_503_SERVICE_UNAVAILABLE,
    AlreadySubscribedError: status.HTTP_409_CONFLICT,
    PlanTypeChangeNotAllowedError: status.HTTP_409_CONFLICT,
    NoActiveSubscriptionError: status.HTTP_409_CONFLICT,
    PaymentFailedError: status.HTTP_402_PAYMENT_REQUIRED,
    ValueError: status.HTTP_400_BAD_REQUEST,
}

PORTAL_ERROR_STATUS: ExceptionStatusMap = {
    BillingNotConfiguredError: status.HTTP_503_SERVICE_UNAVAILABLE,
    ValueError: status.HTTP_404_NOT_FOUND,
}

def raise_billing_http(
    exc: BaseException, status_by_type: ExceptionStatusMap
) -> NoReturn:
    """Re-raise a known billing error as HTTPException; otherwise re-raise as-is."""
    for error_type, status_code in status_by_type.items():
        if isinstance(exc, error_type):
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    raise exc

def reject_if_rate_limited(rate_key: str, detail: str) -> None:
    from app.utils.rate_limit import is_rate_limited

    if is_rate_limited(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )
