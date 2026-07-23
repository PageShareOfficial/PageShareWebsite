"""Smart ladder selection from prediction window length (no market I/O)."""

from datetime import datetime, timedelta, timezone

from app.services.prediction_evaluate_engine import (
    LADDER_FROM_15M,
    LADDER_FROM_1D,
    LADDER_FROM_1H,
    LADDER_FROM_6H,
    pick_coarse_interval,
    pick_search_ladder,
)

UTC = timezone.utc
T0 = datetime(2024, 6, 1, 12, 0, tzinfo=UTC)

def _ladder_for(duration: timedelta):
    return pick_search_ladder(T0, T0 + duration)

def test_smart_ladder_30_minutes_starts_at_15m():
    assert _ladder_for(timedelta(minutes=30)) == LADDER_FROM_15M

def test_smart_ladder_45_minutes_starts_at_15m():
    assert _ladder_for(timedelta(minutes=45)) == LADDER_FROM_15M

def test_smart_ladder_just_under_1h_starts_at_15m():
    assert _ladder_for(timedelta(minutes=59)) == LADDER_FROM_15M

def test_smart_ladder_1h_starts_at_1h():
    assert _ladder_for(timedelta(hours=1)) == LADDER_FROM_1H

def test_smart_ladder_2h_starts_at_1h():
    assert _ladder_for(timedelta(hours=2)) == LADDER_FROM_1H

def test_smart_ladder_just_under_6h_starts_at_1h():
    assert _ladder_for(timedelta(hours=5, minutes=59)) == LADDER_FROM_1H

def test_smart_ladder_6h_starts_at_6h():
    assert _ladder_for(timedelta(hours=6)) == LADDER_FROM_6H

def test_smart_ladder_12h_and_24h_exclusive_use_6h():
    assert _ladder_for(timedelta(hours=12)) == LADDER_FROM_6H
    assert _ladder_for(timedelta(hours=23, minutes=59)) == LADDER_FROM_6H

def test_smart_ladder_1_day_starts_at_1d():
    assert _ladder_for(timedelta(days=1)) == LADDER_FROM_1D

def test_smart_ladder_2_days_starts_at_1d():
    assert _ladder_for(timedelta(days=2)) == LADDER_FROM_1D

def test_pick_coarse_matches_ladder_head():
    cases = (
        timedelta(minutes=30),
        timedelta(hours=2),
        timedelta(hours=12),
        timedelta(days=1),
    )
    for duration in cases:
        start, end = T0, T0 + duration
        assert pick_coarse_interval(start, end) == pick_search_ladder(start, end)[0]

def test_practical_timegaps_table():
    """Readable matrix of product-relevant windows → expected ladder head."""
    expectations = [
        (timedelta(minutes=30), "15m", LADDER_FROM_15M),
        (timedelta(hours=1), "1h", LADDER_FROM_1H),
        (timedelta(hours=2), "1h", LADDER_FROM_1H),
        (timedelta(hours=6), "6h", LADDER_FROM_6H),
        (timedelta(hours=24), "1d", LADDER_FROM_1D),
        (timedelta(days=2), "1d", LADDER_FROM_1D),
    ]
    for duration, head, full in expectations:
        ladder = _ladder_for(duration)
        assert ladder[0] == head
        assert ladder == full
