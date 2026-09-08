"""Live Coinbase evaluate with zoom/search trace (manual / docs).

Writes: tests/docs/live_evaluate_zoom_trace.md
Run from backend/:
  $env:PYTHONPATH = "."
  python tests/docs/live_evaluate_zoom_trace.py
"""

from __future__ import annotations
from datetime import datetime, timedelta, timezone
from pathlib import Path
from time import perf_counter
from app.services.coinbase_market_service import Candle, get_candles
from app.services.prediction_evaluate_engine import (
    INTERVAL_DURATION,
    EvaluateTimings,
    _candles_for_scan,
    _clamp_zoom,
    _next_search_action,
    candle_hits_stop,
    candle_hits_target,
    evaluate_from_candles,
    floor_to_interval,
    pick_search_ladder,
    resolve_candle_outcome,
)

UTC = timezone.utc
OUT_PATH = Path(__file__).with_name("live_evaluate_zoom_trace.md")

def _fmt(dt: datetime | None) -> str:
    return dt.isoformat() if dt else "null"

def _candle_line(candle: Candle) -> str:
    return (
        f"open={_fmt(candle.open_time)}  "
        f"O={candle.open:.2f} H={candle.high:.2f} "
        f"L={candle.low:.2f} C={candle.close:.2f}"
    )

def _hit_reason(candle: Candle, *, position: str, target: float, stop: float) -> str:
    hit_t = candle_hits_target(candle, position=position, target=target)
    hit_s = candle_hits_stop(candle, position=position, stop=stop)
    if hit_t and hit_s:
        return f"DUAL HIT (target {target:.2f} AND stop {stop:.2f}) -> loss"
    if hit_t:
        return f"TARGET hit ({target:.2f}) on high={candle.high:.2f}"
    if hit_s:
        return f"STOP hit ({stop:.2f}) on low={candle.low:.2f}"
    return "neither"

def trace_smart_search(
    *,
    asset: str,
    position: str,
    entry: float,
    target: float,
    stop: float,
    start_time: datetime,
    expiry_at: datetime,
    lines: list[str],
    ladder: tuple[str, ...] | None = None,
) -> tuple:
    clock = EvaluateTimings()
    search_started = perf_counter()
    start = start_time.astimezone(UTC)
    end = expiry_at.astimezone(UTC)
    active_ladder = ladder or pick_search_ladder(start, end)
    window_start, window_end = start, end
    last_candles: list[Candle] = []
    has_zoomed = False

    lines.append("## Search ladder")
    lines.append(f"- Ladder: `{' -> '.join(active_ladder)}`")
    lines.append(f"- Prediction window: `{_fmt(start)}` -> `{_fmt(end)}`")
    lines.append(
        f"- Levels (long): entry={entry:.2f} target={target:.2f} stop={stop:.2f}"
    )
    lines.append("")

    for index, interval in enumerate(active_ladder):
        step = index + 1
        fetch_start = floor_to_interval(window_start, interval)
        lines.append(f"### Step {step}: fetch `{interval}`")
        lines.append(
            f"- Search window: `{_fmt(window_start)}` -> `{_fmt(window_end)}`"
        )
        lines.append(
            f"- Fetch from floored open `{_fmt(fetch_start)}` "
            f"(covers mid-bucket start)"
        )
        t0 = perf_counter()
        candles = get_candles(asset, interval, fetch_start, window_end)
        fetch_ms = (perf_counter() - t0) * 1000
        clock.record_fetch(interval, fetch_ms)
        clock.candles_scanned += len(candles)
        lines.append(f"- Fetched **{len(candles)}** candle(s) in **{fetch_ms:.0f} ms**")

        if not candles:
            lines.append("- Empty -> continue")
            lines.append("")
            continue

        is_finest = index == len(active_ladder) - 1
        usable = _candles_for_scan(candles, start=start, end=end)
        if usable:
            last_candles = usable

        for candle in candles:
            outcome_one = resolve_candle_outcome(
                candle, position=position, target=target, stop=stop
            )
            leading = candle.open_time < start
            mark = ""
            if leading:
                mark = "  << LEADING PARTIAL (opens before prediction start)"
            elif outcome_one is not None:
                mark = f"  << INTERESTING ({outcome_one})"
            lines.append(f"  - `{interval}` {_candle_line(candle)}{mark}")

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
            assert action.zoom_start and action.zoom_end and action.hit_candle
            lines.append(
                f"- **LEADING GAP:** bar opened `{_fmt(action.hit_candle.open_time)}` "
                f"but prediction starts `{_fmt(start)}` — do not trust full-bar OHLC."
            )
            lines.append(
                f"- **Nested refine leading remainder** "
                f"`{_fmt(action.zoom_start)}` -> `{_fmt(action.zoom_end)}`"
            )
            lines.append("")
            if not is_finest and index + 1 < len(active_ladder):
                nested_lines: list[str] = []
                nested_result, nested_clock = trace_smart_search(
                    asset=asset,
                    position=position,
                    entry=entry,
                    target=target,
                    stop=stop,
                    start_time=action.zoom_start,
                    expiry_at=action.zoom_end,
                    lines=nested_lines,
                    ladder=active_ladder[index + 1 :],
                )
                clock.candle_fetches += nested_clock.candle_fetches
                clock.candles_scanned += nested_clock.candles_scanned
                for key, value in nested_clock.fetch_ms_by_interval.items():
                    clock.fetch_ms_by_interval[key] = (
                        clock.fetch_ms_by_interval.get(key, 0.0) + value
                    )
                for nested_line in nested_lines:
                    lines.append(f"  {nested_line}" if nested_line else "")
                if nested_result.outcome != "expired":
                    clock.search_ms = (perf_counter() - search_started) * 1000
                    return nested_result, clock
                remaining = [c for c in candles if c.open_time >= action.zoom_end]
                if not remaining:
                    clock.search_ms = (perf_counter() - search_started) * 1000
                    return nested_result, clock
                lines.append(
                    "- Leading remainder clean — **resume** later candles "
                    "at this interval."
                )
                action = _next_search_action(
                    remaining,
                    interval=interval,
                    position=position,
                    target=target,
                    stop=stop,
                    pred_start=start,
                    pred_end=end,
                    is_finest=is_finest,
                )
                if action.kind == "none":
                    lines.append(
                        "- **No level touch after leading partial + remainder** "
                        "-> expire early (no finer fetches)."
                    )
                    lines.append("")
                    break
                has_zoomed = True
            else:
                window_start, window_end = action.zoom_start, action.zoom_end
                has_zoomed = True
                continue

        if action.kind == "none":
            if not has_zoomed:
                lines.append(
                    "- **No level touch on coarse full window** -> expire early "
                    "(no finer fetches)."
                )
                lines.append("")
                break
            lines.append("- No hit in this zoomed slice -> try next interval.")
            lines.append("")
            continue

        assert action.hit_candle is not None
        reason = _hit_reason(
            action.hit_candle, position=position, target=target, stop=stop
        )
        lines.append(
            f"- **First interesting candle at `{interval}`:** "
            f"`{_fmt(action.hit_candle.open_time)}` — {reason}"
        )

        if is_finest:
            lines.append(
                f"- Finest interval `{interval}` — **search result locked** "
                f"on this candle."
            )
            lines.append("")
            clock.search_ms = (perf_counter() - search_started) * 1000
            result = evaluate_from_candles(
                usable, position=position, entry=entry, target=target, stop=stop
            )
            return result, clock

        zoom_start, zoom_end = _clamp_zoom(
            action.hit_candle, interval, start=start, end=end
        )
        duration = INTERVAL_DURATION[interval]
        lines.append(
            f"- **ZOOM into candle** `{_fmt(action.hit_candle.open_time)}` "
            f"({interval} bar, span {duration}) -> "
            f"next fetch `{_fmt(zoom_start)}` -> `{_fmt(zoom_end)}`"
        )
        lines.append("")
        window_start, window_end = zoom_start, zoom_end
        has_zoomed = True

    clock.search_ms = (perf_counter() - search_started) * 1000
    result = evaluate_from_candles(
        last_candles, position=position, entry=entry, target=target, stop=stop
    )
    return result, clock

def main() -> None:
    now = datetime.now(UTC)
    asset = "BTC"
    end = now - timedelta(minutes=5)
    start = end - timedelta(hours=6)
    coarse = get_candles(asset, "6h", floor_to_interval(start, "6h"), end)
    if not coarse:
        raise SystemExit("No coarse candles from Coinbase")

    lo = min(c.low for c in coarse)
    hi = max(c.high for c in coarse)
    mid = (lo + hi) / 2
    expiry = now - timedelta(minutes=2)
    start_t = expiry - timedelta(hours=6)

    cases = [
        ("zoom_win_near_high", mid, hi * 0.998, lo * 0.99),
        ("zoom_loss_near_low", mid, hi * 1.05, lo * 1.002),
    ]

    doc: list[str] = [
        "# Live evaluate — zoom & search trace",
        "",
        f"Generated: `{now.isoformat()}` (UTC)",
        f"Asset: **{asset}** via Coinbase Exchange",
        "",
        "Note: fetch start is **floored** to the candle bucket so mid-bucket",
        "prediction starts (e.g. 11:09 inside a 06:00–12:00 6h bar) are covered",
        "via a **leading partial zoom**, not skipped.",
        "",
    ]

    for name, entry, target, stop in cases:
        lines: list[str] = [f"## Case: `{name}`", ""]
        result, clock = trace_smart_search(
            asset=asset,
            position="long",
            entry=entry,
            target=target,
            stop=stop,
            start_time=start_t,
            expiry_at=expiry,
            lines=lines,
        )
        lines.append("## Final search result")
        lines.append(f"- **outcome:** `{result.outcome}`")
        lines.append(f"- **status:** `{result.status}`")
        lines.append(f"- **hit_price:** `{result.hit_price:.2f}`")
        lines.append(f"- **hit_at:** `{_fmt(result.hit_at)}`")
        if result.hit_at:
            lines.append(
                f"- **Found in candle:** open_time=`{_fmt(result.hit_at)}` "
                f"(1m bucket that first touched target or stop)"
            )
        lines.append(f"- **return_pct:** `{result.return_pct:.6f}`")
        lines.append(f"- **resolution_note:** `{result.resolution_note}`")
        intervals = ", ".join(
            f"{k}:{v:.0f}ms" for k, v in clock.fetch_ms_by_interval.items()
        )
        lines.append(
            f"- **timings:** fetches={clock.candle_fetches}, "
            f"candles_scanned={clock.candles_scanned}, "
            f"fetch_ms={clock.fetch_ms_total:.0f}, "
            f"search_ms={clock.search_ms:.0f}, by_interval={{{intervals}}}"
        )
        lines.append("")
        lines.append("---")
        lines.append("")
        doc.extend(lines)

    OUT_PATH.write_text("\n".join(doc), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")

if __name__ == "__main__":
    main()
