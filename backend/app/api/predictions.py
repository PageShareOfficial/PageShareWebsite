"""Prediction endpoints: submit and submission quota."""

from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.prediction import (
    CreatePredictionRequest,
    PredictionLivePriceResponse,
    PredictionResponse,
    PredictionSubmissionQuotaResponse,
)
from app.services.auth_service import CurrentUser
from app.services.coinbase_assets import coinbase_product_id
from app.services.prediction_service import (
    AnalystRequiredError,
    DailyLimitExceededError,
    MarketPriceError,
    create_prediction,
    fetch_live_price_for_asset,
    get_prediction_for_user,
    get_submission_quota,
    list_predictions_for_user,
)
from app.services.prediction_settle_service import settle_due_predictions_for_user
from app.services.prediction_validation_service import PredictionValidationError
from app.services.user_service import get_or_create_user_for_auth
from app.utils.http import parse_uuid_or_404
from app.utils.rate_limit import is_rate_limited
from app.utils.responses import paginated_response

router = APIRouter(prefix="/predictions", tags=["predictions"])

CLIENT_TIMEZONE_HEADER = "X-Client-Timezone"
LIVE_PRICE_RATE_LIMIT = 30

def _optional_float(value) -> float | None:
    return float(value) if value is not None else None

def _to_response(prediction) -> PredictionResponse:
    return PredictionResponse(
        id=str(prediction.id),
        asset=prediction.asset,
        asset_name=prediction.asset_name,
        prediction_type=prediction.prediction_type,
        position=prediction.position,
        entry_price=float(prediction.entry_price),
        target_price=float(prediction.target_price),
        stop_loss=float(prediction.stop_loss),
        start_time=prediction.start_time,
        expiry_at=prediction.expiry_at,
        lock_started_at=prediction.lock_started_at,
        confidence=float(prediction.confidence),
        thesis=prediction.thesis,
        thesis_image_url=prediction.thesis_image_url,
        status=prediction.status,
        outcome=prediction.outcome,
        resolved_at=prediction.resolved_at,
        hit_price=_optional_float(prediction.hit_price),
        hit_at=prediction.hit_at,
        return_pct=_optional_float(prediction.return_pct),
        resolution_source=prediction.resolution_source,
        resolution_note=prediction.resolution_note,
        created_at=prediction.created_at,
    )


@router.get("/live-price", response_model=PredictionLivePriceResponse)
def prediction_live_price(
    asset: str = Query(..., min_length=1, max_length=32),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Coinbase live price for lock UI (server proxy)."""
    user_id = UUID(current_user.auth_user_id)
    if is_rate_limited(
        f"predictions:live-price:{user_id}",
        max_requests=LIVE_PRICE_RATE_LIMIT,
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many price requests. Please try again shortly.",
        )
    try:
        normalized, price = fetch_live_price_for_asset(asset)
    except MarketPriceError as exc:
        detail = str(exc)
        if "Invalid asset" in detail or "required" in detail.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail,
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail or "Price feed temporarily unavailable.",
        ) from exc
    return PredictionLivePriceResponse(
        asset=normalized,
        product_id=coinbase_product_id(normalized),
        price=price,
    )

@router.get("/submission-quota", response_model=PredictionSubmissionQuotaResponse)
def prediction_submission_quota(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    client_timezone: str | None = Header(default=None, alias=CLIENT_TIMEZONE_HEADER),
):
    user_id = UUID(current_user.auth_user_id)
    return PredictionSubmissionQuotaResponse(
        **get_submission_quota(db, user_id, client_timezone=client_timezone)
    )

@router.get("", response_model=dict)
def list_my_predictions(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List current user's predictions; settle up to 5 due rows first (owner only)."""
    user_id = UUID(current_user.auth_user_id)
    settle_due_predictions_for_user(db, user_id)
    rows, total = list_predictions_for_user(
        db, user_id, page=page, per_page=per_page
    )
    data = [_to_response(row) for row in rows]
    return paginated_response(data, page, per_page, total)

@router.get("/{prediction_id}", response_model=dict)
def get_my_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Owner detail; settle up to 5 due rows first, then return this prediction."""
    pid = parse_uuid_or_404(prediction_id, "Prediction not found")
    user_id = UUID(current_user.auth_user_id)
    settle_due_predictions_for_user(db, user_id)
    prediction = get_prediction_for_user(db, user_id, pid)
    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    return {"data": _to_response(prediction)}

@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def submit_prediction(
    body: CreatePredictionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    client_timezone: str | None = Header(default=None, alias=CLIENT_TIMEZONE_HEADER),
):
    get_or_create_user_for_auth(db, current_user)
    user_id = UUID(current_user.auth_user_id)

    try:
        prediction = create_prediction(
            db,
            user_id=user_id,
            asset=body.asset,
            asset_name=body.asset_name,
            position=body.position,
            entry_price=body.entry_price,
            target_price=body.target_price,
            stop_loss=body.stop_loss,
            lock_started_at=body.lock_started_at,
            expiry_at=body.expiry_at,
            confidence=body.confidence,
            thesis=body.thesis,
            thesis_image_url=body.thesis_image_url,
            client_timezone=client_timezone,
        )
    except AnalystRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except DailyLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except MarketPriceError as exc:
        detail = str(exc)
        if "Invalid asset" in detail or "required" in detail.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail,
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail or "Price feed temporarily unavailable.",
        ) from exc
    except PredictionValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_response(prediction)
