"""Response models for crypto events (sourced from Coinpedia)."""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


class CryptoEventResponse(BaseModel):
    id: str
    name: str
    url: str
    image_url: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    utc_offset: Optional[str] = None
    status: Optional[Literal["ongoing", "upcoming", "ended"]] = None
    ticket_type: Optional[Literal["free", "paid", "stay_tuned"]] = None
    event_type: Optional[str] = None


class CryptoEventsSourceResponse(BaseModel):
    name: str
    url: str


class CryptoEventsListResponse(BaseModel):
    data: list[CryptoEventResponse]
    source: CryptoEventsSourceResponse
    fetched_at: Optional[datetime] = None
    is_stale: bool = False
