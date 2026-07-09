"""Prediction endpoints: submit and submission quota."""

from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.prediction import (
    CreatePredictionRequest,
    PredictionResponse,
    PredictionSubmissionQuotaResponse,
)
from app.services.auth_service import CurrentUser
from app.services.prediction_service import (
    AnalystRequiredError,
    DailyLimitExceededError,
    create_prediction,
    get_submission_quota,
)
from app.services.prediction_validation_service import PredictionValidationError
from app.services.user_service import get_or_create_user_for_auth

router = APIRouter(prefix="/predictions", tags=["predictions"])

CLIENT_TIMEZONE_HEADER = "X-Client-Timezone"

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
        created_at=prediction.created_at,
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
    except PredictionValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_response(prediction)
