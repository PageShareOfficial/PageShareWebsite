from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

class CreatePredictionRequest(BaseModel):
    asset: str = Field(..., min_length=1, max_length=32)
    asset_name: Optional[str] = Field(None, max_length=120)
    position: Literal["long", "short"]
    entry_price: float = Field(..., gt=0)
    target_price: float = Field(..., gt=0)
    stop_loss: float = Field(..., gt=0)
    lock_started_at: datetime
    expiry_at: datetime
    confidence: float = Field(..., ge=0.5, le=0.95)
    thesis: str = Field(..., min_length=1, max_length=300)
    thesis_image_url: Optional[str] = Field(None, max_length=2048)

    @field_validator("asset")
    @classmethod
    def normalize_asset(cls, value: str) -> str:
        return value.strip().upper()

class PredictionResponse(BaseModel):
    id: str
    asset: str
    asset_name: Optional[str] = None
    prediction_type: str
    position: Literal["long", "short"]
    entry_price: float
    target_price: float
    stop_loss: float
    start_time: datetime
    expiry_at: datetime
    lock_started_at: datetime
    confidence: float
    thesis: str
    thesis_image_url: Optional[str] = None
    status: str
    outcome: Optional[Literal["win", "loss", "expired"]] = None
    resolved_at: Optional[datetime] = None
    hit_price: Optional[float] = None
    hit_at: Optional[datetime] = None
    return_pct: Optional[float] = None
    resolution_source: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime

class PredictionSubmissionQuotaResponse(BaseModel):
    used: int
    max: int
    remaining: int

class PredictionLivePriceResponse(BaseModel):
    asset: str
    product_id: str
    price: float

class PredictionAnalyticsSubject(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    profile_picture_url: Optional[str] = None

class PredictionAnalyticsSummaryResponse(BaseModel):
    subject: PredictionAnalyticsSubject
    total_predictions: int
    wins: int
    losses: int
    win_rate_percent: Optional[float] = None
    rank: Optional[int] = None

class NetRrSeriesPointResponse(BaseModel):
    resolved_at: datetime
    cumulative_net_rr: float

class AnalyticsPeriodStatsResponse(BaseModel):
    net_rr: float
    win_rate_percent: Optional[float] = None
    resolved_count: int
    wins: int
    losses: int
    expired: int

class AnalyticsLifetimeStatsResponse(BaseModel):
    total_predictions: int
    active_count: int
    resolved_count: int
    wins: int
    losses: int
    expired: int
    win_rate_percent: Optional[float] = None
    average_return_percent: Optional[float] = None

class AssetCountResponse(BaseModel):
    asset: str
    count: int

class AnalyticsTradingStyleResponse(BaseModel):
    long_count: int = 0
    short_count: int = 0
    long_percent: Optional[float] = None
    short_percent: Optional[float] = None
    top_assets: list[AssetCountResponse] = Field(default_factory=list)
    average_confidence: Optional[float] = None
    average_setup_rr: Optional[float] = None

class PredictionAnalyticsDashboardResponse(BaseModel):
    subject: PredictionAnalyticsSubject
    rank: Optional[int] = None
    rank_total: int = 0
    net_rr_30d: float = 0.0
    recent_30d: AnalyticsPeriodStatsResponse
    net_rr_series_30d: list[NetRrSeriesPointResponse] = Field(default_factory=list)
    lifetime: AnalyticsLifetimeStatsResponse
    style: AnalyticsTradingStyleResponse
