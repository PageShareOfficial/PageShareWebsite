"""Timezone helpers for user-local calendar boundaries."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from zoneinfo import ZoneInfo

UTC_ALIASES = frozenset({"UTC", "GMT", "ETC/UTC", "ETC/GMT"})

def resolve_timezone_name(
    profile_timezone: Optional[str],
    client_timezone: Optional[str] = None,
) -> str:
    """Prefer live client timezone, then stored profile timezone, then UTC."""
    for candidate in (client_timezone, profile_timezone, "UTC"):
        if candidate and candidate.strip():
            return candidate.strip()
    return "UTC"

def resolve_timezone(tz_name: Optional[str]) -> Union[ZoneInfo, timezone]:
    """Resolve IANA timezone; uses stdlib UTC for aliases and on failure."""
    name = (tz_name or "UTC").strip()
    if name.upper() in UTC_ALIASES:
        return timezone.utc
    try:
        return ZoneInfo(name)
    except Exception:
        return timezone.utc

def local_day_bounds_utc(
    tz_name: Optional[str],
    *,
    moment: Optional[datetime] = None,
) -> tuple[datetime, datetime]:
    """
    Return [start, end) UTC bounds for the local calendar day in tz_name.
    end is exclusive (start of next local day).
    """
    now = moment or datetime.now(timezone.utc)
    tz = resolve_timezone(tz_name)
    local_now = now.astimezone(tz)
    local_day_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    local_day_end = local_day_start + timedelta(days=1)
    return (
        local_day_start.astimezone(timezone.utc),
        local_day_end.astimezone(timezone.utc),
    )
