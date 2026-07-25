"""Prediction endpoints: submit and submission quota."""

from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.prediction_api_constants import (
    CLIENT_TIMEZONE_HEADER,
    LIVE_PRICE_RATE_LIMIT_PER_MINUTE,
)
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.prediction import (
    CreatePredictionRequest,
    PredictionAnalyticsDashboardResponse,
    PredictionAnalyticsDetailResponse,
    PredictionAnalyticsSubject,
    PredictionIndexItemResponse,
    PredictionIndexListResponse,
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
from app.services.prediction_analytics_service import (
    get_analyst_dashboard_for_investor,
    get_own_analytics_dashboard,
)
from app.services.prediction_analytics_predictions_service import (
    get_analyst_prediction_detail_for_investor,
    get_own_prediction_detail,
    list_analyst_prediction_index_for_investor,
    list_own_prediction_index,
)
from app.services.prediction_settle_service import settle_due_predictions_for_user
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    InvestorRequiredError,
)
from app.services.prediction_validation_service import PredictionValidationError
from app.services.user_service import get_or_create_user_for_auth
from app.utils.http import parse_uuid_or_404
from app.utils.rate_limit import is_rate_limited
from app.utils.responses import paginated_response

router = APIRouter(prefix="/predictions", tags=["predictions"])

def _optional_float(value) -> float | None:
    return float(value) if value is not None else None

def _analytics_subject(user) -> PredictionAnalyticsSubject:
    return PredictionAnalyticsSubject(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        profile_picture_url=user.profile_picture_url,
    )

def _dashboard_response(user, dashboard) -> PredictionAnalyticsDashboardResponse:
    return PredictionAnalyticsDashboardResponse(
        subject=_analytics_subject(user),
        rank=dashboard.rank,
        rank_total=dashboard.rank_total,
        net_rr_30d=dashboard.net_rr_30d,
        recent_30d={
            "net_rr": dashboard.recent_30d.net_rr,
            "win_rate_percent": dashboard.recent_30d.win_rate_percent,
            "resolved_count": dashboard.recent_30d.resolved_count,
            "wins": dashboard.recent_30d.wins,
            "losses": dashboard.recent_30d.losses,
            "expired": dashboard.recent_30d.expired,
        },
        net_rr_series_30d=[
            {
                "resolved_at": point.resolved_at,
                "cumulative_net_rr": point.cumulative_net_rr,
            }
            for point in dashboard.net_rr_series_30d
        ],
        lifetime={
            "total_predictions": dashboard.lifetime.total_predictions,
            "active_count": dashboard.lifetime.active_count,
            "resolved_count": dashboard.lifetime.resolved_count,
            "wins": dashboard.lifetime.wins,
            "losses": dashboard.lifetime.losses,
            "expired": dashboard.lifetime.expired,
            "win_rate_percent": dashboard.lifetime.win_rate_percent,
            "average_return_percent": dashboard.lifetime.average_return_percent,
        },
        style={
            "long_count": dashboard.style.long_count,
            "short_count": dashboard.style.short_count,
            "long_percent": dashboard.style.long_percent,
            "short_percent": dashboard.style.short_percent,
            "top_assets": [
                {"asset": item.asset, "count": item.count}
                for item in dashboard.style.top_assets
            ],
            "average_confidence": dashboard.style.average_confidence,
            "average_setup_rr": dashboard.style.average_setup_rr,
        },
    )

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

def _index_list_response(items) -> PredictionIndexListResponse:
    return PredictionIndexListResponse(
        items=[
            PredictionIndexItemResponse(
                id=str(item.id),
                number=item.number,
                asset=item.asset,
                status=item.status,
                outcome=item.outcome,
                created_at=item.created_at,
            )
            for item in items
        ],
        total=len(items),
    )

def _detail_response(number: int, prediction) -> PredictionAnalyticsDetailResponse:
    return PredictionAnalyticsDetailResponse(
        number=number,
        prediction=_to_response(prediction),
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
        max_requests=LIVE_PRICE_RATE_LIMIT_PER_MINUTE,
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

@router.get("/analytics/me", response_model=PredictionAnalyticsDashboardResponse)
def prediction_analytics_me(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Analyst-only dashboard for the signed-in user."""
    user_id = UUID(current_user.auth_user_id)
    try:
        user, dashboard = get_own_analytics_dashboard(db, user_id)
    except AnalystRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    return _dashboard_response(user, dashboard)

@router.get(
    "/analytics/users/{username}",
    response_model=PredictionAnalyticsDashboardResponse,
)
def prediction_analytics_for_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Investor-only dashboard for an analyst profile."""
    investor_id = UUID(current_user.auth_user_id)
    try:
        user, dashboard = get_analyst_dashboard_for_investor(
            db, investor_id, username
        )
    except InvestorRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except AnalystTargetRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _dashboard_response(user, dashboard)


@router.get("/analytics/me/predictions", response_model=PredictionIndexListResponse)
def prediction_analytics_me_index(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Analyst prediction index for analytics tab (no batch settle)."""
    user_id = UUID(current_user.auth_user_id)
    try:
        items = list_own_prediction_index(db, user_id)
    except AnalystRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    return _index_list_response(items)


@router.get(
    "/analytics/me/predictions/{prediction_id}",
    response_model=PredictionAnalyticsDetailResponse,
)
def prediction_analytics_me_detail(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Single prediction detail; settles this row only if due."""
    pid = parse_uuid_or_404(prediction_id, "Prediction not found")
    user_id = UUID(current_user.auth_user_id)
    try:
        number, prediction = get_own_prediction_detail(db, user_id, pid)
    except AnalystRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _detail_response(number, prediction)


@router.get(
    "/analytics/users/{username}/predictions",
    response_model=PredictionIndexListResponse,
)
def prediction_analytics_user_index(
    username: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Investor view of an analyst's prediction index (no settle)."""
    investor_id = UUID(current_user.auth_user_id)
    try:
        _, items = list_analyst_prediction_index_for_investor(
            db, investor_id, username
        )
    except InvestorRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except AnalystTargetRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _index_list_response(items)


@router.get(
    "/analytics/users/{username}/predictions/{prediction_id}",
    response_model=PredictionAnalyticsDetailResponse,
)
def prediction_analytics_user_detail(
    username: str,
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Investor detail; lazy-settles this prediction if due (analyst cohort)."""
    pid = parse_uuid_or_404(prediction_id, "Prediction not found")
    investor_id = UUID(current_user.auth_user_id)
    try:
        _, number, prediction = get_analyst_prediction_detail_for_investor(
            db, investor_id, username, pid
        )
    except InvestorRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except AnalystTargetRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _detail_response(number, prediction)

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
