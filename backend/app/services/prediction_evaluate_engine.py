"""Pure prediction evaluate engine (A–D) with Coinbase coarse→fine search."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from time import perf_counter
from typing import Callable, Literal, Optional, Sequence
from app.models.prediction import Prediction
from app.services.coinbase_market_service import Candle, CandleInterval, get_candles
from app.services.prediction_constants import (
    OUTCOME_EXPIRED,
    OUTCOME_LOSS,
    OUTCOME_WIN,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_STATUS_COMPLETED,
    PREDICTION_STATUS_EXPIRED,
    RESOLUTION_SOURCE_COINBASE,
)
from app.services.prediction_evaluate_constants import (
    INTERVAL_DURATION,
    LADDER_FROM_15M,
    LADDER_FROM_1D,
    LADDER_FROM_1H,
    LADDER_FROM_6H,
    SEARCH_LADDER,
)

Position = Literal["long", "short"]
Outcome = Literal["win", "loss", "expired"]

@dataclass(frozen=True)
class EvaluationResult:
    outcome: Outcome
    return_pct: float
    hit_price: float
    hit_at: Optional[datetime]
    status: str
    resolution_note: Optional[str] = None

@dataclass
class EvaluateTimings:
    """Wall-clock timings (ms) for UI / settle budgeting."""

    fetch_ms_by_interval: dict[str, float] = field(default_factory=dict)
    search_ms: float = 0.0
    apply_ms: float = 0.0
    total_ms: float = 0.0
    candle_fetches: int = 0
    candles_scanned: int = 0

    def record_fetch(self, interval: str, elapsed_ms: float) -> None:
        self.fetch_ms_by_interval[interval] = (
            self.fetch_ms_by_interval.get(interval, 0.0) + elapsed_ms
        )
        self.candle_fetches += 1

    @property
    def fetch_ms_total(self) -> float:
        return sum(self.fetch_ms_by_interval.values())

class EvaluationError(Exception):
    """Evaluate failed (e.g. empty market data)."""

def lower_bound_by_open_time(
    candles: Sequence[Candle], target: datetime
) -> int:
    """First index with open_time >= target (binary search)."""
    lo, hi = 0, len(candles)
    while lo < hi:
        mid = (lo + hi) // 2
        if candles[mid].open_time < target:
            lo = mid + 1
        else:
            hi = mid
    return lo

def slice_candles_in_window(
    candles: Sequence[Candle],
    start: datetime,
    end: datetime,
) -> list[Candle]:
    """Return candles with open_time in [start, end] via binary bounds."""
    if not candles:
        return []
    left = lower_bound_by_open_time(candles, start)
    right = lower_bound_by_open_time(candles, end + timedelta(microseconds=1))
    return list(candles[left:right])

def candle_hits_target(candle: Candle, *, position: Position, target: float) -> bool:
    if position == "long":
        return candle.high >= target
    return candle.low <= target

def candle_hits_stop(candle: Candle, *, position: Position, stop: float) -> bool:
    if position == "long":
        return candle.low <= stop
    return candle.high >= stop

def compute_return_pct(
    *,
    position: Position,
    entry: float,
    target: float,
    stop: float,
    outcome: Outcome,
    expiry_price: Optional[float] = None,
) -> float:
    if entry <= 0:
        raise ValueError("entry must be > 0")
    if outcome == OUTCOME_WIN:
        exit_price = target
    elif outcome == OUTCOME_LOSS:
        exit_price = stop
    else:
        if expiry_price is None:
            raise ValueError("expiry_price required for expired outcome")
        exit_price = expiry_price
    if position == "long":
        return (exit_price - entry) / entry
    return (entry - exit_price) / entry

def resolve_candle_outcome(
    candle: Candle,
    *,
    position: Position,
    target: float,
    stop: float,
) -> Optional[Outcome]:
    """Outcome from one candle. Dual-hit → loss. None if neither level."""
    hit_target = candle_hits_target(candle, position=position, target=target)
    hit_stop = candle_hits_stop(candle, position=position, stop=stop)
    if hit_target and hit_stop:
        return OUTCOME_LOSS
    if hit_target:
        return OUTCOME_WIN
    if hit_stop:
        return OUTCOME_LOSS
    return None

def scan_first_hit(
    candles: Sequence[Candle],
    *,
    position: Position,
    target: float,
    stop: float,
) -> tuple[Optional[Outcome], Optional[Candle]]:
    """Walk candles in time order; return first decisive outcome + candle."""
    for candle in candles:
        outcome = resolve_candle_outcome(
            candle, position=position, target=target, stop=stop
        )
        if outcome is not None:
            return outcome, candle
    return None, None

def pick_search_ladder(start: datetime, end: datetime) -> tuple[CandleInterval, ...]:
    """Choose coarse→fine ladder from prediction window length (no market I/O).

    Boundaries (inclusive lower, exclusive upper except the top band):
    - duration >= 1 day           → 1d → 6h → 1h → 15m → 1m
    - 6h <= duration < 1 day      → 6h → 1h → 15m → 1m
    - 1h <= duration < 6h         → 1h → 15m → 1m
    - duration < 1h (incl. 30m)   → 15m → 1m

    Skips coarser Coinbase buckets that cannot fit the window usefully, so a
    30m/1h/2h prediction does not pay for a useless 6h fetch.
    """
    duration = _to_utc(end) - _to_utc(start)
    if duration < timedelta(0):
        raise ValueError("expiry_at must be >= start_time")
    if duration >= timedelta(days=1):
        return LADDER_FROM_1D
    if duration >= timedelta(hours=6):
        return LADDER_FROM_6H
    if duration >= timedelta(hours=1):
        return LADDER_FROM_1H
    return LADDER_FROM_15M

def pick_coarse_interval(start: datetime, end: datetime) -> CandleInterval:
    """First (coarsest) interval on the smart ladder for this window."""
    return pick_search_ladder(start, end)[0]

def floor_to_interval(moment: datetime, interval: CandleInterval) -> datetime:
    """Floor UTC time to Coinbase bucket open (multiples of interval length)."""
    moment = _to_utc(moment)
    seconds = int(INTERVAL_DURATION[interval].total_seconds())
    if seconds <= 0:
        raise ValueError(f"Invalid interval duration: {interval}")
    timestamp = int(moment.timestamp())
    floored = timestamp - (timestamp % seconds)
    return datetime.fromtimestamp(floored, tz=timezone.utc)

def zoom_slice_for_candle(candle: Candle, interval: CandleInterval) -> tuple[datetime, datetime]:
    """Time window covering one coarse candle for the next finer fetch."""
    duration = INTERVAL_DURATION[interval]
    return candle.open_time, candle.open_time + duration

def evaluate_from_candles(
    candles: Sequence[Candle],
    *,
    position: Position,
    entry: float,
    target: float,
    stop: float,
) -> EvaluationResult:
    """Evaluate using a single finest candle series (already sorted)."""
    if not candles:
        raise EvaluationError("No candles available to evaluate")

    outcome, hit_candle = scan_first_hit(
        candles, position=position, target=target, stop=stop
    )
    last = candles[-1]
    if outcome is None:
        return_pct = compute_return_pct(
            position=position,
            entry=entry,
            target=target,
            stop=stop,
            outcome=OUTCOME_EXPIRED,
            expiry_price=last.close,
        )
        return EvaluationResult(
            outcome=OUTCOME_EXPIRED,
            return_pct=return_pct,
            hit_price=last.close,
            hit_at=None,
            status=PREDICTION_STATUS_EXPIRED,
            resolution_note="neither_level_hit",
        )

    hit_price = target if outcome == OUTCOME_WIN else stop
    return_pct = compute_return_pct(
        position=position,
        entry=entry,
        target=target,
        stop=stop,
        outcome=outcome,
    )
    assert hit_candle is not None
    note = "dual_hit_same_candle" if (
        candle_hits_target(hit_candle, position=position, target=target)
        and candle_hits_stop(hit_candle, position=position, stop=stop)
    ) else None
    return EvaluationResult(
        outcome=outcome,
        return_pct=return_pct,
        hit_price=hit_price,
        hit_at=hit_candle.open_time,
        status=PREDICTION_STATUS_COMPLETED,
        resolution_note=note,
    )

def evaluate_smart_search(
    *,
    position: Position,
    entry: float,
    target: float,
    stop: float,
    start_time: datetime,
    expiry_at: datetime,
    fetch_candles: Callable[
        [CandleInterval, datetime, datetime], list[Candle]
    ],
    timings: Optional[EvaluateTimings] = None,
    ladder: Optional[tuple[CandleInterval, ...]] = None,
) -> EvaluationResult:
    """Coarse→fine: zoom first interesting slice; expire early if coarse misses.

    Mid-bucket starts: floor fetch open, refine leading partial on finer
    intervals (nested), then resume later full bars so the rest of the
    prediction window is not dropped.
    """
    clock = timings or EvaluateTimings()
    search_started = perf_counter()
    start = _to_utc(start_time)
    end = _to_utc(expiry_at)
    active_ladder = ladder or pick_search_ladder(start, end)
    window_start, window_end = start, end
    last_candles: list[Candle] = []
    has_zoomed = False

    for index, interval in enumerate(active_ladder):
        candles = _timed_fetch(
            fetch_candles, interval, window_start, window_end, clock
        )
        clock.candles_scanned += len(candles)
        if not candles:
            continue
        is_finest = index == len(active_ladder) - 1
        usable = _candles_for_scan(candles, start=start, end=end)
        if usable:
            last_candles = usable
        action = _next_search_action(
            candles,
            interval=interval,
            position=position,
            target=target,
            stop=stop,
            pred_start=start,
            pred_end=end,
            is_finest=is_finest,
        )
        if action.kind == "zoom_leading":
            resolved = _after_leading_partial(
                action,
                candles=candles,
                interval=interval,
                position=position,
                entry=entry,
                target=target,
                stop=stop,
                pred_start=start,
                pred_end=end,
                is_finest=is_finest,
                index=index,
                active_ladder=active_ladder,
                fetch_candles=fetch_candles,
                clock=clock,
                search_started=search_started,
            )
            if resolved.kind == "done":
                assert resolved.result is not None
                return resolved.result
            action = resolved
        if action.kind == "none":
            if not has_zoomed:
                break
            continue
        assert action.kind == "hit" and action.hit_candle is not None
        if is_finest:
            clock.search_ms = (perf_counter() - search_started) * 1000
            return evaluate_from_candles(
                usable,
                position=position,
                entry=entry,
                target=target,
                stop=stop,
            )
        window_start, window_end = _clamp_zoom(
            action.hit_candle, interval, start=start, end=end
        )
        has_zoomed = True

    clock.search_ms = (perf_counter() - search_started) * 1000
    if not last_candles:
        raise EvaluationError("No candles available to evaluate")
    return evaluate_from_candles(
        last_candles,
        position=position,
        entry=entry,
        target=target,
        stop=stop,
    )

@dataclass(frozen=True)
class _SearchAction:
    kind: Literal["none", "zoom_leading", "hit", "done"]
    hit_candle: Optional[Candle] = None
    zoom_start: Optional[datetime] = None
    zoom_end: Optional[datetime] = None
    result: Optional[EvaluationResult] = None

def _after_leading_partial(
    action: _SearchAction,
    *,
    candles: Sequence[Candle],
    interval: CandleInterval,
    position: Position,
    entry: float,
    target: float,
    stop: float,
    pred_start: datetime,
    pred_end: datetime,
    is_finest: bool,
    index: int,
    active_ladder: tuple[CandleInterval, ...],
    fetch_candles: Callable[
        [CandleInterval, datetime, datetime], list[Candle]
    ],
    clock: EvaluateTimings,
    search_started: float,
) -> _SearchAction:
    """Nested-refine leading remainder; resume later bars if that slice is clean."""
    assert action.zoom_start is not None and action.zoom_end is not None
    if is_finest or index + 1 >= len(active_ladder):
        return _next_search_action(
            [c for c in candles if c.open_time >= pred_start],
            interval=interval,
            position=position,
            target=target,
            stop=stop,
            pred_start=pred_start,
            pred_end=pred_end,
            is_finest=True,
        )
    nested = evaluate_smart_search(
        position=position,
        entry=entry,
        target=target,
        stop=stop,
        start_time=action.zoom_start,
        expiry_at=action.zoom_end,
        fetch_candles=fetch_candles,
        timings=clock,
        ladder=active_ladder[index + 1 :],
    )
    if nested.outcome != OUTCOME_EXPIRED:
        clock.search_ms = (perf_counter() - search_started) * 1000
        return _SearchAction(kind="done", result=nested)
    remaining = [c for c in candles if c.open_time >= action.zoom_end]
    if not remaining:
        clock.search_ms = (perf_counter() - search_started) * 1000
        return _SearchAction(kind="done", result=nested)
    return _next_search_action(
        remaining,
        interval=interval,
        position=position,
        target=target,
        stop=stop,
        pred_start=pred_start,
        pred_end=pred_end,
        is_finest=is_finest,
    )

def _candles_for_scan(
    candles: Sequence[Candle],
    *,
    start: datetime,
    end: datetime,
) -> list[Candle]:
    """Bars that opened inside the prediction window (skip leading partials)."""
    return [c for c in candles if start <= c.open_time <= end]

def _next_search_action(
    candles: Sequence[Candle],
    *,
    interval: CandleInterval,
    position: Position,
    target: float,
    stop: float,
    pred_start: datetime,
    pred_end: datetime,
    is_finest: bool,
) -> _SearchAction:
    """First leading-partial zoom or first in-window level hit."""
    duration = INTERVAL_DURATION[interval]
    for candle in candles:
        candle_end = candle.open_time + duration
        if candle_end <= pred_start or candle.open_time > pred_end:
            continue
        if candle.open_time < pred_start:
            if is_finest:
                continue
            return _SearchAction(
                kind="zoom_leading",
                hit_candle=candle,
                zoom_start=pred_start,
                zoom_end=min(candle_end, pred_end),
            )
        outcome = resolve_candle_outcome(
            candle, position=position, target=target, stop=stop
        )
        if outcome is not None:
            return _SearchAction(kind="hit", hit_candle=candle)
    return _SearchAction(kind="none")

def _clamp_zoom(
    candle: Candle,
    interval: CandleInterval,
    *,
    start: datetime,
    end: datetime,
) -> tuple[datetime, datetime]:
    zoom_start, zoom_end = zoom_slice_for_candle(candle, interval)
    return max(zoom_start, start), min(zoom_end, end)

def evaluate_prediction_market(
    *,
    asset: str,
    position: Position,
    entry: float,
    target: float,
    stop: float,
    start_time: datetime,
    expiry_at: datetime,
    get_candles_fn: Callable[..., list[Candle]] = get_candles,
    timings: Optional[EvaluateTimings] = None,
) -> tuple[EvaluationResult, EvaluateTimings]:
    """Fetch Coinbase candles via smart search and evaluate once."""
    clock = timings or EvaluateTimings()
    total_started = perf_counter()

    def fetch(interval: CandleInterval, start: datetime, end: datetime) -> list[Candle]:
        return get_candles_fn(asset, interval, start, end)

    result = evaluate_smart_search(
        position=position,
        entry=entry,
        target=target,
        stop=stop,
        start_time=start_time,
        expiry_at=expiry_at,
        fetch_candles=fetch,
        timings=clock,
    )
    clock.total_ms = (perf_counter() - total_started) * 1000
    return result, clock

def apply_evaluation_to_prediction(
    prediction: Prediction,
    result: EvaluationResult,
    *,
    resolved_at: Optional[datetime] = None,
    timings: Optional[EvaluateTimings] = None,
) -> bool:
    """Persist evaluation once. Returns False if already resolved."""
    apply_started = perf_counter()
    if prediction.outcome is not None or prediction.status != PREDICTION_STATUS_ACTIVE:
        if timings is not None:
            timings.apply_ms = (perf_counter() - apply_started) * 1000
        return False

    when = resolved_at or datetime.now(timezone.utc)
    prediction.outcome = result.outcome
    prediction.return_pct = result.return_pct
    prediction.hit_price = result.hit_price
    prediction.hit_at = result.hit_at
    prediction.resolved_at = when
    prediction.resolution_source = RESOLUTION_SOURCE_COINBASE
    prediction.resolution_note = result.resolution_note
    prediction.status = result.status
    prediction.updated_at = when
    if timings is not None:
        timings.apply_ms = (perf_counter() - apply_started) * 1000
    return True

def _ladder_from(coarse: CandleInterval) -> tuple[CandleInterval, ...]:
    """Build a ladder that starts at ``coarse`` (tests / nested overrides)."""
    if coarse == "1d":
        return LADDER_FROM_1D
    if coarse == "6h":
        return LADDER_FROM_6H
    if coarse == "1h":
        return LADDER_FROM_1H
    if coarse == "15m":
        return LADDER_FROM_15M
    return LADDER_FROM_15M

def _timed_fetch(
    fetch_candles: Callable[[CandleInterval, datetime, datetime], list[Candle]],
    interval: CandleInterval,
    start: datetime,
    end: datetime,
    timings: EvaluateTimings,
) -> list[Candle]:
    """Fetch from floored bucket open so mid-bucket prediction starts are covered."""
    started = perf_counter()
    fetch_start = floor_to_interval(start, interval)
    candles = fetch_candles(interval, fetch_start, end)
    timings.record_fetch(interval, (perf_counter() - started) * 1000)
    return candles

def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
