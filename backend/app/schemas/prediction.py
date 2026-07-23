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
