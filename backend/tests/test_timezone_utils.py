"""Tests for timezone utility helpers."""

from datetime import datetime, timezone
import pytest
from app.utils.timezone_utils import (
    local_day_bounds_utc,
    resolve_timezone,
    resolve_timezone_name,
)

def test_resolve_timezone_name_prefers_client_over_profile():
    assert resolve_timezone_name("America/New_York", "Asia/Kolkata") == "Asia/Kolkata"

def test_resolve_timezone_name_falls_back_to_profile():
    assert resolve_timezone_name("Asia/Kolkata", None) == "Asia/Kolkata"

def test_resolve_timezone_uses_stdlib_utc_for_utc_alias():
    assert resolve_timezone("UTC") is timezone.utc

def test_local_day_bounds_utc_for_utc_timezone():
    moment = datetime(2026, 7, 9, 15, 30, tzinfo=timezone.utc)
    start, end = local_day_bounds_utc("UTC", moment=moment)
    assert start == datetime(2026, 7, 9, 0, 0, tzinfo=timezone.utc)
    assert end == datetime(2026, 7, 10, 0, 0, tzinfo=timezone.utc)

def test_local_day_bounds_utc_for_ist_midday():
    try:
        tz = resolve_timezone("Asia/Kolkata")
    except Exception:
        pytest.skip("tzdata not available")
    if tz is timezone.utc:
        pytest.skip("tzdata not available")

    # 2026-07-09 12:00 IST = 06:30 UTC
    moment = datetime(2026, 7, 9, 6, 30, tzinfo=timezone.utc)
    start, end = local_day_bounds_utc("Asia/Kolkata", moment=moment)
    # IST day start = 2026-07-08 18:30 UTC
    assert start == datetime(2026, 7, 8, 18, 30, tzinfo=timezone.utc)
    assert end == datetime(2026, 7, 9, 18, 30, tzinfo=timezone.utc)
