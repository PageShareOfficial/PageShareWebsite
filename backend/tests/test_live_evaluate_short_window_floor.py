"""Live 30m / 1h prediction windows — confirm floor + leading-gap zoom.

Writes: tests/test_reports/09_PREDICTION_LIVE_SHORT_WINDOW_FLOOR.md
Run from backend/:
  $env:PYTHONPATH = "."
  python tests/test_live_evaluate_short_window_floor.py
"""

from __future__ import annotations
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from app.services.coinbase_market_service import get_candles
from app.services.prediction_evaluate_engine import floor_to_interval

try:
    from test_live_evaluate_zoom_trace import _fmt, trace_smart_search
except ImportError:  # pytest collection from backend root
    from tests.test_live_evaluate_zoom_trace import _fmt, trace_smart_search

pytestmark = pytest.mark.skip(
    reason=(
        "Manual live Coinbase script; run: "
        "python tests/test_live_evaluate_short_window_floor.py"
    )
)

UTC = timezone.utc
REPORTS_DIR = Path(__file__).resolve().parent / "test_reports"
OUT_PATH = REPORTS_DIR / "09_PREDICTION_LIVE_SHORT_WINDOW_FLOOR.md"
ASSET = "BTC"

def _mid_bucket_window(duration: timedelta, *, now: datetime) -> tuple[datetime, datetime]:
    """Completed window with exact duration; start forced mid 1h bucket if needed."""
    expiry = now - timedelta(minutes=3)
    start = expiry - duration
    if start.minute == 0 and start.second == 0:
        shift = timedelta(minutes=17, seconds=42)
        start -= shift
        expiry -= shift
    assert floor_to_interval(start, "6h") < start
    return start, expiry

def _levels_from_window(start: datetime, end: datetime) -> tuple[float, float, float, float]:
    candles = get_candles(ASSET, "1m", floor_to_interval(start, "1m"), end)
    if not candles:
        raise RuntimeError("No 1m candles for window")
    lo = min(c.low for c in candles)
    hi = max(c.high for c in candles)
    mid = (lo + hi) / 2
    return mid, hi * 0.998, lo * 1.002, hi * 1.08

def _append_case(
    doc: list[str],
    *,
    title: str,
    start: datetime,
    end: datetime,
    entry: float,
    target: float,
    stop: float,
) -> None:
    lines: list[str] = [f"## {title}", ""]
    minutes = (end - start).total_seconds() / 60
    lines.append(f"- Duration: **{minutes:.1f} minutes**")
    lines.append(f"- start=`{_fmt(start)}` expiry=`{_fmt(end)}`")
    lines.append(f"- floor(`6h`)=`{_fmt(floor_to_interval(start, '6h'))}`")
    lines.append(f"- floor(`1h`)=`{_fmt(floor_to_interval(start, '1h'))}`")
    gap_6h_min = (start - floor_to_interval(start, "6h")).total_seconds() / 60
    lines.append(
        f"- Minutes after floored 6h open until prediction start: **~{gap_6h_min:.0f} min**"
    )
    lines.append("")
    result, clock = trace_smart_search(
        asset=ASSET,
        position="long",
        entry=entry,
        target=target,
        stop=stop,
        start_time=start,
        expiry_at=end,
        lines=lines,
    )
    lines.append("## Final search result")
    lines.append(f"- **outcome:** `{result.outcome}`")
    lines.append(f"- **hit_price:** `{result.hit_price:.2f}`")
    lines.append(f"- **hit_at:** `{_fmt(result.hit_at)}`")
    lines.append(f"- **return_pct:** `{result.return_pct:.6f}`")
    lines.append(f"- **resolution_note:** `{result.resolution_note}`")
    intervals = ", ".join(
        f"{k}:{v:.0f}ms" for k, v in clock.fetch_ms_by_interval.items()
    )
    lines.append(
        f"- **timings:** fetches={clock.candle_fetches}, "
        f"candles_scanned={clock.candles_scanned}, "
        f"fetch_ms={clock.fetch_ms_total:.0f}, search_ms={clock.search_ms:.0f}, "
        f"by_interval={{{intervals}}}"
    )
    leading = any("LEADING GAP" in line or "LEADING PARTIAL" in line for line in lines)
    floored = any("Fetch from floored open" in line for line in lines)
    lines.append("")
    lines.append("### Floor check")
    lines.append(f"- Floored fetch logged: **{floored}**")
    lines.append(f"- Leading partial / leading gap zoom logged: **{leading}**")
    if result.hit_at is not None:
        ok = start <= result.hit_at <= end
        lines.append(
            f"- hit_at inside prediction window: **{ok}** (`{_fmt(result.hit_at)}`)"
        )
    else:
        lines.append("- hit_at: `null` (expired path)")
    lines.append("")
    lines.append("---")
    lines.append("")
    doc.extend(lines)

def main() -> None:
    now = datetime.now(UTC)
    doc: list[str] = [
        "# Live short-window floor confirmation (30m / 1h)",
        "",
        f"Generated: `{now.isoformat()}` (UTC)",
        f"Asset: **{ASSET}**",
        "",
        "Goal: prove mid-bucket prediction starts are covered via "
        "`floor_to_interval` + **leading partial zoom**, not skipped until "
        "the next aligned candle open.",
        "",
    ]

    for label, duration in (
        ("30-minute prediction", timedelta(minutes=30)),
        ("1-hour prediction", timedelta(hours=1)),
    ):
        start, end = _mid_bucket_window(duration, now=now)
        entry, near_high, near_low, far_high = _levels_from_window(start, end)

        _append_case(
            doc,
            title=f"{label} — zoom near high",
            start=start,
            end=end,
            entry=entry,
            target=near_high,
            stop=min(near_low * 0.99, entry * 0.98),
        )
        _append_case(
            doc,
            title=f"{label} — zoom near low",
            start=start,
            end=end,
            entry=entry,
            target=far_high,
            stop=near_low,
        )
        _append_case(
            doc,
            title=f"{label} — wide levels (expect expired)",
            start=start,
            end=end,
            entry=entry,
            target=entry * 1.25,
            stop=entry * 0.75,
        )

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(doc), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")

if __name__ == "__main__":
    main()
