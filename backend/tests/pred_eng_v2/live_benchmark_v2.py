"""Live A/B benchmark: prediction engine v1 (new connection per request) vs v2 (shared).

Runs the same prediction windows through both modes against Coinbase and writes:
  tests/pred_eng_v2/results_v2.json  — raw runs (for later diffs)
  tests/pred_eng_v2/REPORT.md        — readable comparison

Run from backend/:
  uv run python tests/pred_eng_v2/live_benchmark_v2.py
"""

from __future__ import annotations
import json
import statistics
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
import httpx
from app.services.coinbase_market_service import create_market_http_client, get_candles
from app.services.prediction_evaluate_engine import (
    evaluate_prediction_market,
    floor_to_interval,
)

UTC = timezone.utc
ASSET = "BTC"
ROUNDS = 2
OUT_DIR = Path(__file__).resolve().parent
JSON_PATH = OUT_DIR / "results_v2.json"
REPORT_PATH = OUT_DIR / "REPORT.md"
DURATIONS: tuple[tuple[str, timedelta], ...] = (
    ("30m", timedelta(minutes=30)),
    ("1h", timedelta(hours=1)),
    ("6h", timedelta(hours=6)),
    ("1d", timedelta(days=1)),
    ("2d", timedelta(days=2)),
    ("7d", timedelta(days=7)),
)
MODES = ("v1_new_connection", "v2_shared_connection")


@dataclass(frozen=True)
class Case:
    name: str
    duration: str
    expected: str
    entry: float
    target: float
    stop: float
    start: datetime
    expiry: datetime


@dataclass(frozen=True)
class Run:
    mode: str
    round: int
    outcome: str
    hit_price: float
    hit_at: Optional[str]
    return_pct: float
    fetches: int
    candles_scanned: int
    fetch_ms: float
    total_ms: float


def _window(duration: timedelta, now: datetime) -> tuple[datetime, datetime]:
    """Completed window ending 3 min ago; start forced mid-hour like real submissions."""
    expiry = now - timedelta(minutes=3)
    start = expiry - duration
    if start.minute == 0:
        shift = timedelta(minutes=17, seconds=42)
        start, expiry = start - shift, expiry - shift
    return start, expiry


def _price_range(start: datetime, end: datetime) -> tuple[float, float]:
    interval = "1m" if end - start <= timedelta(hours=2) else "1h"
    candles = get_candles(ASSET, interval, floor_to_interval(start, interval), end)
    inside = [c for c in candles if c.open_time >= start] or candles
    if not inside:
        raise RuntimeError(f"No candles for window {start} -> {end}")
    return min(c.low for c in inside), max(c.high for c in inside)


def build_cases(now: datetime) -> list[Case]:
    cases: list[Case] = []
    for label, duration in DURATIONS:
        start, expiry = _window(duration, now)
        low, high = _price_range(start, expiry)
        mid = (low + high) / 2
        levels = (
            ("win", high * 0.998, low * 0.99),
            ("loss", high * 1.05, low * 1.002),
            ("expired", mid * 1.25, mid * 0.75),
        )
        for expected, target, stop in levels:
            cases.append(
                Case(f"{label}_{expected}", label, expected, mid, target, stop, start, expiry)
            )
    return cases


def run_case(case: Case, mode: str, round_index: int, client: Optional[httpx.Client]) -> Run:
    result, timings = evaluate_prediction_market(
        asset=ASSET,
        position="long",
        entry=case.entry,
        target=case.target,
        stop=case.stop,
        start_time=case.start,
        expiry_at=case.expiry,
        client=client,
    )
    return Run(
        mode=mode,
        round=round_index,
        outcome=result.outcome,
        hit_price=round(result.hit_price, 2),
        hit_at=result.hit_at.isoformat() if result.hit_at else None,
        return_pct=round(result.return_pct, 6),
        fetches=timings.candle_fetches,
        candles_scanned=timings.candles_scanned,
        fetch_ms=round(timings.fetch_ms_total, 1),
        total_ms=round(timings.total_ms, 1),
    )


def run_mode(cases: list[Case], mode: str, round_index: int) -> list[Run]:
    """v1 passes no client (engine opens one per request); v2 shares one for the batch."""
    if mode == "v1_new_connection":
        return [run_case(case, mode, round_index, None) for case in cases]
    with create_market_http_client() as client:
        return [run_case(case, mode, round_index, client) for case in cases]


def run_benchmark(cases: list[Case]) -> dict[str, list[list[Run]]]:
    """Alternate mode order each round so neither mode always runs on a warmer cache."""
    runs: dict[str, list[list[Run]]] = {mode: [] for mode in MODES}
    for round_index in range(1, ROUNDS + 1):
        order = MODES if round_index % 2 == 1 else tuple(reversed(MODES))
        for mode in order:
            print(f"Round {round_index}: {mode} ...", flush=True)
            runs[mode].append(run_mode(cases, mode, round_index))
    return runs


def _case_runs(runs: dict[str, list[list[Run]]], mode: str, index: int) -> list[Run]:
    return [round_runs[index] for round_runs in runs[mode]]


def _same_result(left: Run, right: Run) -> bool:
    return (left.outcome, left.hit_price, left.hit_at) == (
        right.outcome,
        right.hit_price,
        right.hit_at,
    )


def summarize_case(case: Case, runs: dict[str, list[list[Run]]], index: int) -> dict:
    v1_runs = _case_runs(runs, MODES[0], index)
    v2_runs = _case_runs(runs, MODES[1], index)
    v1_ms = statistics.mean(run.total_ms for run in v1_runs)
    v2_ms = statistics.mean(run.total_ms for run in v2_runs)
    return {
        "case": asdict(case)
        | {"start": case.start.isoformat(), "expiry": case.expiry.isoformat()},
        "v1_mean_total_ms": round(v1_ms, 1),
        "v2_mean_total_ms": round(v2_ms, 1),
        "speedup_pct": round((v1_ms - v2_ms) / v1_ms * 100, 1) if v1_ms else 0.0,
        "results_identical": all(_same_result(v1_runs[0], run) for run in v1_runs + v2_runs),
        "matches_expected": v2_runs[0].outcome == case.expected,
        "runs": [asdict(run) for run in v1_runs + v2_runs],
    }


def summarize_mode(runs: dict[str, list[list[Run]]], mode: str) -> dict:
    flat = [run for round_runs in runs[mode] for run in round_runs]
    fetches = sum(run.fetches for run in flat)
    fetch_ms = sum(run.fetch_ms for run in flat)
    batch_totals = [sum(run.total_ms for run in round_runs) for round_runs in runs[mode]]
    return {
        "evaluations": len(flat),
        "mean_total_ms": round(statistics.mean(run.total_ms for run in flat), 1),
        "median_total_ms": round(statistics.median(run.total_ms for run in flat), 1),
        "mean_ms_per_request": round(fetch_ms / fetches, 1) if fetches else 0.0,
        "mean_batch_ms": round(statistics.mean(batch_totals), 1),
        "total_requests": fetches,
    }


# From reports 08 and 09 (20 Jul 2026, v1 engine): 29,296 ms over 41 Coinbase requests.
HISTORICAL_V1_MS_PER_REQUEST = 714.5


def _percent_faster(before: float, after: float) -> str:
    return f"{(before - after) / before * 100:.1f}%" if before else "n/a"


def _summary_lines(summary: dict) -> list[str]:
    v1, v2 = summary[MODES[0]], summary[MODES[1]]
    rows = (
        ("Mean time per prediction", "mean_total_ms"),
        ("Median time per prediction", "median_total_ms"),
        ("Mean time per Coinbase request", "mean_ms_per_request"),
        ("Batch of all cases (one cron run)", "mean_batch_ms"),
    )
    lines = [
        "| Metric | v1 new connection | v2 shared connection | v2 faster by |",
        "|---|---|---|---|",
    ]
    for label, key in rows:
        lines.append(
            f"| {label} | {v1[key]:,.0f} ms | {v2[key]:,.0f} ms | "
            f"{_percent_faster(v1[key], v2[key])} |"
        )
    lines.append(
        f"| Coinbase requests (all rounds) | {v1['total_requests']} | "
        f"{v2['total_requests']} | same search path |"
    )
    return lines


def _case_lines(case_summaries: list[dict]) -> list[str]:
    lines = [
        "| Case | Outcome (v1 / v2) | Identical | Expected | v1 ms | v2 ms | Faster |",
        "|---|---|---|---|---|---|---|",
    ]
    for item in case_summaries:
        runs = item["runs"]
        outcomes = f"{runs[0]['outcome']} / {runs[-1]['outcome']}"
        lines.append(
            f"| `{item['case']['name']}` | {outcomes} | "
            f"{'yes' if item['results_identical'] else '**NO**'} | "
            f"{'yes' if item['matches_expected'] else 'no'} | "
            f"{item['v1_mean_total_ms']:,.0f} | {item['v2_mean_total_ms']:,.0f} | "
            f"{item['speedup_pct']}% |"
        )
    return lines


def _intro_lines(payload: dict) -> list[str]:
    return [
        "# Prediction engine v2 — live benchmark",
        "",
        f"Generated: `{payload['generated_at']}` (UTC)  ",
        f"Asset: **{ASSET}** via Coinbase Exchange  ",
        f"Cases: **{len(payload['cases'])}** ({len(DURATIONS)} window lengths × win / loss / "
        f"expired), **{ROUNDS} rounds** per mode, mode order alternated each round.",
        "",
        "- **v1** = previous behaviour: a new HTTPS connection for every candle request.",
        "- **v2** = shared connection for the whole batch (what the scheduled settle job uses).",
        "",
        "Both modes run the same windows and levels back to back, so market conditions match.",
        "",
    ]


def _correctness_lines(cases: list[dict]) -> list[str]:
    identical = all(item["results_identical"] for item in cases)
    return [
        "## Correctness",
        "",
        f"All outcomes, hit prices and hit times identical between v1 and v2: "
        f"**{'yes' if identical else 'NO — investigate'}**",
        "",
    ]


def _speed_lines(summary: dict) -> list[str]:
    v2_request_ms = summary[MODES[1]]["mean_ms_per_request"]
    return [
        "## Speed",
        "",
        *_summary_lines(summary),
        "",
        f"Historical v1 reference (reports 08 / 09, 20 Jul 2026, different market and "
        f"network): **{HISTORICAL_V1_MS_PER_REQUEST} ms per request** vs v2 today "
        f"**{v2_request_ms} ms**.",
        "",
        "Network note: the saving comes from skipping a new TLS handshake per request, so it",
        "grows with distance to Coinbase. Run from a developer machine, it overstates the gain on",
        "a server close to Coinbase; outcome equality holds regardless.",
        "",
    ]


def write_report(payload: dict) -> None:
    lines = [
        *_intro_lines(payload),
        *_correctness_lines(payload["cases"]),
        *_speed_lines(payload["summary"]),
        "## Per case (mean of rounds)",
        "",
        *_case_lines(payload["cases"]),
        "",
        "\"Expected\" checks the generated levels produced the intended outcome; a \"no\" means",
        "the price path differed from the level guess, not an engine error.",
        "",
        "Raw runs: `results_v2.json`. Re-run: "
        "`uv run python tests/pred_eng_v2/live_benchmark_v2.py` from `backend/`.",
        "",
    ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    now = datetime.now(UTC)
    cases = build_cases(now)
    runs = run_benchmark(cases)
    payload = {
        "engine_version": "v2_shared_connection",
        "generated_at": now.isoformat(),
        "asset": ASSET,
        "rounds": ROUNDS,
        "summary": {mode: summarize_mode(runs, mode) for mode in MODES},
        "cases": [summarize_case(case, runs, index) for index, case in enumerate(cases)],
    }
    JSON_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_report(payload)
    print(f"Wrote {JSON_PATH}\nWrote {REPORT_PATH}")


if __name__ == "__main__":
    main()
