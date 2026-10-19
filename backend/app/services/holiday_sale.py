"""Holiday sale phases. Stripe promotion codes use these same code strings."""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

UTC = timezone.utc


@dataclass(frozen=True)
class SalePhase:
    """One sale window. `ends_at` is exclusive."""

    code: str
    percent_off: int
    name: str
    offer: str
    starts_at: datetime
    ends_at: datetime

# Half-open UTC windows: [start, end). Matches 00:00 through 23:59:59 on the last day.
SALE_PHASES: tuple[SalePhase, ...] = (
    SalePhase(
        code="EARLYCOMERS15",
        percent_off=15,
        name="Early Access",
        offer="Black Friday starts early",
        starts_at=datetime(2026, 11, 12, tzinfo=UTC),
        ends_at=datetime(2026, 11, 27, tzinfo=UTC),
    ),
    SalePhase(
        code="BLACKFRIDAY30",
        percent_off=30,
        name="Black Friday",
        offer="Our biggest offer of the year",
        starts_at=datetime(2026, 11, 27, tzinfo=UTC),
        ends_at=datetime(2026, 12, 2, tzinfo=UTC),
    ),
    SalePhase(
        code="GOODBYE2026",
        percent_off=26,
        name="Holiday",
        offer="Holiday offer",
        starts_at=datetime(2026, 12, 2, tzinfo=UTC),
        ends_at=datetime(2026, 12, 25, tzinfo=UTC),
    ),
    SalePhase(
        code="NEWYEAR27",
        percent_off=27,
        name="New Year",
        offer="Last call, ends 5 Jan",
        starts_at=datetime(2026, 12, 25, tzinfo=UTC),
        ends_at=datetime(2027, 1, 6, tzinfo=UTC),
    ),
)

# Public labels. Checkout still uses SalePhase.name.
STRIP_HEADLINES: dict[str, str] = {
    "EARLYCOMERS15": "Early Access",
    "BLACKFRIDAY30": "Black Friday to Cyber Monday",
    "GOODBYE2026": "Holiday sale",
    "NEWYEAR27": "New Year sale",
}

def sale_promotion_codes() -> frozenset[str]:
    """The season's promotion code strings. A customer may redeem one of them."""
    return frozenset(phase.code for phase in SALE_PHASES)

def _as_utc(moment: datetime) -> datetime:
    if moment.tzinfo is not None:
        return moment
    return moment.replace(tzinfo=UTC)

def active_sale_phase(now: datetime) -> Optional[SalePhase]:
    """The phase checkout can apply. None outside 12 Nov 2026–5 Jan 2027 UTC."""
    current = _as_utc(now)
    for phase in SALE_PHASES:
        if phase.starts_at <= current < phase.ends_at:
            return phase
    return None


@dataclass(frozen=True)
class SaleStripFace:
    """One side of the landing strip. `headline` is the public label."""

    code: str
    percent_off: int
    name: str
    offer: str
    headline: str
    starts_at: datetime
    ends_at: datetime

# The strip is a teaser from this instant, before Early Access can be purchased.
STRIP_VISIBLE_FROM = datetime(2026, 10, 19, tzinfo=UTC)

def _strip_face(phase: SalePhase) -> SaleStripFace:
    return SaleStripFace(
        code=phase.code,
        percent_off=phase.percent_off,
        name=phase.name,
        offer=phase.offer,
        headline=STRIP_HEADLINES[phase.code],
        starts_at=phase.starts_at,
        ends_at=phase.ends_at,
    )

def _upcoming_pair(current: datetime) -> Optional[tuple[SaleStripFace, ...]]:
    """The offer on screen, plus the next one, until that next offer begins."""
    for index, phase in enumerate(SALE_PHASES[1:], start=1):
        if current < phase.starts_at:
            previous = SALE_PHASES[index - 1]
            return (_strip_face(previous), _strip_face(phase))
    return None

def sale_strip_faces(now: datetime) -> tuple[SaleStripFace, ...]:
    """Current offer, then the next one. The last phase is a single face."""
    current = _as_utc(now)
    if current < STRIP_VISIBLE_FROM:
        return ()
    paired = _upcoming_pair(current)
    if paired is not None:
        return paired
    last = SALE_PHASES[-1]
    if current < last.ends_at:
        return (_strip_face(last),)
    return ()
