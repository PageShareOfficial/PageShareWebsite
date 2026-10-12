"""Crypto events: GET /events (Coinpedia listing, cached in memory, no DB)."""

from dataclasses import asdict
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.crypto_event import (
    CryptoEventResponse,
    CryptoEventsListResponse,
    CryptoEventsSourceResponse,
)
from app.services.crypto_events_service import (
    COINPEDIA_EVENTS_URL,
    EventsSnapshot,
    get_crypto_events,
)

router = APIRouter(prefix="/events", tags=["events"])

EVENTS_SOURCE = CryptoEventsSourceResponse(name="Coinpedia", url=COINPEDIA_EVENTS_URL)
# Events change slowly; let the CDN absorb repeat requests between server refreshes.
CACHE_HEADERS = {"Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"}

@router.get("", response_model=CryptoEventsListResponse)
def list_crypto_events() -> JSONResponse:
    """Ongoing and upcoming crypto events. Sync def: the Coinpedia fetch is blocking."""
    body = build_events_response(get_crypto_events())
    return JSONResponse(content=body.model_dump(mode="json"), headers=CACHE_HEADERS)

def build_events_response(snapshot: EventsSnapshot) -> CryptoEventsListResponse:
    return CryptoEventsListResponse(
        data=[CryptoEventResponse(**asdict(event)) for event in snapshot.events],
        source=EVENTS_SOURCE,
        fetched_at=snapshot.fetched_at,
        is_stale=snapshot.is_stale,
    )
