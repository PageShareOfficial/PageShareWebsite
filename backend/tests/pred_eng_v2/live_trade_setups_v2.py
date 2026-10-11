"""Live trade-setup verification: v1 vs v2 settle path, checked against a brute-force scan.

Each setup is a realistic analyst call (entry at the real start-minute price, stop, target)
on a window that has already closed. Every setup is settled through the real settle path
(`_try_settle_prediction` → evaluate → `apply_evaluation_to_prediction`) twice:
  v1 — no shared client (new HTTPS connection per Coinbase request, previous behaviour)
  v2 — one shared client for the batch (scheduled settle job behaviour)
Both are compared with ground truth: every 1m candle in the window scanned in order.

Writes tests/pred_eng_v2/trade_setups_v2.json and TRADE_SETUPS_REPORT.md.
Run from backend/:
  uv run python tests/pred_eng_v2/live_trade_setups_v2.py
"""

from __future__ import annotations
import json
from contextlib import contextmanager
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from time import perf_counter
from typing import Iterator, Optional
from unittest.mock import patch
from uuid import uuid4
from app.models.prediction import Prediction
from app.services import coinbase_market_service
from app.services.coinbase_market_service import (
    Candle,
    create_market_http_client,
    get_candles,
)
from app.services.prediction_constants import PREDICTION_STATUS_ACTIVE
from app.services.prediction_settle_service import _try_settle_prediction

UTC = timezone.utc
OUT_DIR = Path(__file__).resolve().parent
JSON_PATH = OUT_DIR / "trade_setups_v2.json"
REPORT_PATH = OUT_DIR / "TRADE_SETUPS_REPORT.md"
START_MINUTE = 23  # mid-candle start, like a real submission
ONE_MINUTE = timedelta(minutes=1)


@dataclass(frozen=True)
class SetupSpec:
    name: str
    asset: str
    position: str
    hours: int
    stop_pct: float
    target_pct: float


SETUPS: tuple[SetupSpec, ...] = (
    SetupSpec("BTC swing long", "BTC", "long", 24, 0.015, 0.030),
    SetupSpec("ETH breakdown short", "ETH", "short", 48, 0.020, 0.040),
    SetupSpec("SOL momentum long", "SOL", "long", 12, 0.020, 0.030),
    SetupSpec("BTC intraday short", "BTC", "short", 6, 0.008, 0.012),
    SetupSpec("ETH scalp long", "ETH", "long", 2, 0.006, 0.010),
    SetupSpec("DOGE swing long", "DOGE", "long", 36, 0.030, 0.050),
)


@dataclass(frozen=True)
class TradeSetup:
    spec: SetupSpec
    start: datetime
    expiry: datetime
    entry: float
    stop: float
    target: float

    @property
    def risk_reward(self) -> float:
        return round(self.spec.target_pct / self.spec.stop_pct, 2)


@dataclass(frozen=True)
class Verdict:
    outcome: str
    hit_price: float
    hit_at: Optional[str]
    return_pct: float


@dataclass
class RequestCounter:
    requests: int = 0
    candles: int = 0
    network_ms: float = 0.0

def _floor_minute(moment: datetime) -> datetime:
    return moment.replace(second=0, microsecond=0)

def _levels(spec: SetupSpec, entry: float) -> tuple[float, float]:
    """(stop, target) from percentage distances; short flips direction."""
    sign = 1 if spec.position == "long" else -1
    stop = entry * (1 - sign * spec.stop_pct)
    target = entry * (1 + sign * spec.target_pct)
    return round(stop, 6), round(target, 6)

def build_setup(spec: SetupSpec, now: datetime) -> TradeSetup:
    """Window closed at least ~35 min ago; entry = open of the start-minute candle."""
    start = (now - timedelta(hours=spec.hours + 1)).replace(
        minute=START_MINUTE, second=0, microsecond=0
    )
    expiry = start + timedelta(hours=spec.hours)
    first = get_candles(spec.asset, "1m", start, start + ONE_MINUTE)
    if not first:
        raise RuntimeError(f"No start candle for {spec.asset} at {start}")
    entry = first[0].open
    stop, target = _levels(spec, entry)
    return TradeSetup(spec, start, expiry, entry, stop, target)

def _first_hit(
    candles: list[Candle], setup: TradeSetup
) -> tuple[Optional[str], Optional[Candle]]:
    """Independent linear scan; a candle touching both levels counts as a loss."""
    is_long = setup.spec.position == "long"
    for candle in candles:
        hit_target = candle.high >= setup.target if is_long else candle.low <= setup.target
        hit_stop = candle.low <= setup.stop if is_long else candle.high >= setup.stop
        if hit_stop:
            return "loss", candle
        if hit_target:
            return "win", candle
    return None, None

def _close_at_expiry(candles: list[Candle], expiry: datetime) -> float:
    """Independent of the engine: last 1m candle fully closed at or before expiry."""
    closed = [c for c in candles if c.open_time + ONE_MINUTE <= expiry]
    if not closed:
        raise RuntimeError(f"No 1m candle closed by expiry {expiry}")
    return closed[-1].close

def ground_truth(setup: TradeSetup) -> tuple[Verdict, int]:
    candles = get_candles(setup.spec.asset, "1m", _floor_minute(setup.start), setup.expiry)
    if not candles:
        raise RuntimeError(f"No 1m candles for {setup.spec.name}")
    outcome, hit_candle = _first_hit(candles, setup)
    if hit_candle is None:
        outcome, exit_price, hit_at = "expired", _close_at_expiry(candles, setup.expiry), None
    else:
        exit_price = setup.target if outcome == "win" else setup.stop
        hit_at = hit_candle.open_time.isoformat()
    sign = 1 if setup.spec.position == "long" else -1
    return_pct = round(sign * (exit_price - setup.entry) / setup.entry, 6)
    return Verdict(outcome, round(exit_price, 6), hit_at, return_pct), len(candles)

class _NoOpSession:
    """Settle path commits/refreshes; these setups are never persisted."""

    def commit(self) -> None:
        return None

    def refresh(self, _instance: object) -> None:
        return None

def _to_prediction(setup: TradeSetup) -> Prediction:
    return Prediction(
        id=uuid4(),
        asset=setup.spec.asset,
        position=setup.spec.position,
        entry_price=setup.entry,
        target_price=setup.target,
        stop_loss=setup.stop,
        start_time=setup.start,
        expiry_at=setup.expiry,
        status=PREDICTION_STATUS_ACTIVE,
        outcome=None,
    )

@contextmanager
def count_coinbase_requests() -> Iterator[RequestCounter]:
    counter = RequestCounter()
    original = coinbase_market_service._get_json

    def counting_get_json(*args, **kwargs):
        started = perf_counter()
        rows = original(*args, **kwargs)
        counter.network_ms += (perf_counter() - started) * 1000
        counter.requests += 1
        counter.candles += len(rows) if isinstance(rows, list) else 0
        return rows

    with patch.object(coinbase_market_service, "_get_json", counting_get_json):
        yield counter

def _verdict_from(prediction: Prediction) -> Verdict:
    return Verdict(
        outcome=prediction.outcome or "unsettled",
        hit_price=round(float(prediction.hit_price or 0), 6),
        hit_at=prediction.hit_at.isoformat() if prediction.hit_at else None,
        return_pct=round(float(prediction.return_pct or 0), 6),
    )

def settle_one(setup: TradeSetup, client) -> dict:
    prediction = _to_prediction(setup)
    with count_coinbase_requests() as counter:
        started = perf_counter()
        settled = _try_settle_prediction(_NoOpSession(), prediction, client=client)
        elapsed_ms = (perf_counter() - started) * 1000
    return {
        "settled": settled,
        "status": prediction.status,
        "resolution_note": prediction.resolution_note,
        "verdict": asdict(_verdict_from(prediction)),
        "ms": round(elapsed_ms, 1),
        "network_ms": round(counter.network_ms, 1),
        "verify_ms": round(elapsed_ms - counter.network_ms, 2),
        "requests": counter.requests,
        "candles": counter.candles,
    }

def settle_batch_v1(setups: list[TradeSetup]) -> list[dict]:
    return [settle_one(setup, None) for setup in setups]

def settle_batch_v2(setups: list[TradeSetup]) -> list[dict]:
    """Same loop as `_settle_rows`, timed per row, with one shared client."""
    with create_market_http_client() as client:
        return [settle_one(setup, client) for setup in setups]

def _same(left: dict, right: dict) -> bool:
    keys = ("outcome", "hit_price", "hit_at")
    return all(left[key] == right[key] for key in keys) and (
        abs(left["return_pct"] - right["return_pct"]) < 1e-6
    )

def _r_multiple(setup: TradeSetup, return_pct: float) -> float:
    return round(return_pct / setup.spec.stop_pct, 2)

def compare(setup: TradeSetup, truth: Verdict, truth_candles: int, v1: dict, v2: dict) -> dict:
    truth_dict = asdict(truth)
    return {
        "setup": {
            "name": setup.spec.name,
            "asset": setup.spec.asset,
            "position": setup.spec.position,
            "window_hours": setup.spec.hours,
            "start": setup.start.isoformat(),
            "expiry": setup.expiry.isoformat(),
            "entry": setup.entry,
            "stop": setup.stop,
            "target": setup.target,
            "risk_reward": setup.risk_reward,
        },
        "ground_truth": truth_dict | {"candles_scanned": truth_candles},
        "v1": v1,
        "v2": v2,
        "v1_matches_truth": _same(v1["verdict"], truth_dict),
        "v2_matches_truth": _same(v2["verdict"], truth_dict),
        "r_multiple": _r_multiple(setup, truth.return_pct),
    }

def _fmt_time(iso: Optional[str]) -> str:
    return iso.replace("+00:00", "Z") if iso else "—"

def _yes_no(flag: bool) -> str:
    return "yes" if flag else "**NO**"

def _match_label(engine: dict, truth: dict) -> str:
    if _same(engine, truth):
        return "match"
    if engine["outcome"] == truth["outcome"]:
        return f"outcome match; exit {engine['hit_price']:,.4f} differs"
    return "**DIFF**"

def _setup_table(results: list[dict]) -> list[str]:
    lines = [
        "| # | Setup | Window | Entry | Stop | Target | R:R |",
        "|---|---|---|---|---|---|---|",
    ]
    for index, item in enumerate(results, start=1):
        s = item["setup"]
        lines.append(
            f"| {index} | {s['name']} ({s['position']}) | {s['window_hours']}h from "
            f"{_fmt_time(s['start'])} | {s['entry']:,.4f} | {s['stop']:,.4f} | "
            f"{s['target']:,.4f} | {s['risk_reward']} |"
        )
    return lines

def _verdict_table(results: list[dict]) -> list[str]:
    lines = [
        "| # | Ground truth (1m scan) | Hit at | Return | R | v1 | v2 |",
        "|---|---|---|---|---|---|---|",
    ]
    for index, item in enumerate(results, start=1):
        truth = item["ground_truth"]
        lines.append(
            f"| {index} | **{truth['outcome']}** @ {truth['hit_price']:,.4f} | "
            f"{_fmt_time(truth['hit_at'])} | {truth['return_pct'] * 100:+.2f}% | "
            f"{item['r_multiple']:+.2f}R | {_match_label(item['v1']['verdict'], truth)} | "
            f"{_match_label(item['v2']['verdict'], truth)} |"
        )
    return lines

def _cost_table(results: list[dict]) -> list[str]:
    lines = [
        "| # | Brute force: requests / candles | Engine: requests / candles | v1 ms | v2 ms |",
        "|---|---|---|---|---|",
    ]
    for index, item in enumerate(results, start=1):
        truth_candles = item["ground_truth"]["candles_scanned"]
        brute_requests = -(-truth_candles // 300)
        lines.append(
            f"| {index} | {brute_requests} / {truth_candles:,} | "
            f"{item['v2']['requests']} / {item['v2']['candles']} | "
            f"{item['v1']['ms']:,.0f} | {item['v2']['ms']:,.0f} |"
        )
    v1_total = sum(item["v1"]["ms"] for item in results)
    v2_total = sum(item["v2"]["ms"] for item in results)
    lines.append(f"| **Total** | | | **{v1_total:,.0f}** | **{v2_total:,.0f}** |")
    return lines

def _breakdown_row(index: int, item: dict) -> str:
    cells = [str(index), str(item["v2"]["requests"])]
    for mode in ("v1", "v2"):
        run = item[mode]
        cells += [
            f"{run['network_ms']:,.0f} ms",
            f"{run['verify_ms']:.1f} ms",
            f"{run['ms']:,.0f} ms",
        ]
    return "| " + " | ".join(cells) + " |"

def _breakdown_table(results: list[dict]) -> list[str]:
    header = [
        "| # | Requests | v1 requests | v1 other | v1 total | v2 requests | v2 other | v2 total |",
        "|---|---|---|---|---|---|---|---|",
    ]
    return header + [_breakdown_row(index, item) for index, item in enumerate(results, start=1)]

def _headline_lines(results: list[dict]) -> list[str]:
    outcomes_match = all(
        r["v1"]["verdict"]["outcome"] == r["v2"]["verdict"]["outcome"]
        and r["v2"]["verdict"]["outcome"] == r["ground_truth"]["outcome"]
        for r in results
    )
    all_match = all(r["v1_matches_truth"] and r["v2_matches_truth"] for r in results)
    v1_v2_identical = all(_same(r["v1"]["verdict"], r["v2"]["verdict"]) for r in results)
    net_r = sum(r["r_multiple"] for r in results)
    return [
        f"- v1 and v2 verdicts identical: **{_yes_no(v1_v2_identical)}**",
        f"- Outcomes (win / loss / expired) match ground truth: **{_yes_no(outcomes_match)}**",
        f"- Every field incl. expiry exit price matches ground truth: **{_yes_no(all_match)}**",
        f"- Net result of the six calls (ground truth): **{net_r:+.2f}R**",
    ]

def _intro_lines(generated_at: str) -> list[str]:
    return [
        "# Prediction engine v2 — live trade-setup verification",
        "",
        f"Generated: `{generated_at}` (UTC) — Coinbase Exchange, closed windows.",
        "",
        "Each setup is settled through the real settle path (`_try_settle_prediction` → "
        "smart-ladder evaluate → `apply_evaluation_to_prediction`):",
        "",
        "- **v1:** new HTTPS connection per Coinbase request (previous behaviour).",
        "- **v2:** one shared connection for the batch (scheduled settle job).",
        "- **Ground truth:** every 1-minute candle in the window scanned in order, independent "
        "of the engine. A candle touching stop and target counts as a loss; an expired exit is "
        "the close of the last 1-minute candle fully closed at or before expiry.",
        "",
    ]

def _timing_lines(results: list[dict]) -> list[str]:
    return [
        "## Cost: engine vs brute force, v1 vs v2",
        "",
        *_cost_table(results),
        "",
        "Brute force is what verification would cost without the smart ladder (every 1m candle).",
        "Engine counts are identical for v1 and v2; only the connection handling differs.",
        "",
        "## Time breakdown per setup",
        "",
        "Requests = time inside Coinbase requests (handshake + download). Other = total minus",
        "requests: opening a new HTTPS client per request in v1, plus the engine itself (~1 ms).",
        "",
        *_breakdown_table(results),
        "",
    ]

def write_report(payload: dict) -> None:
    results = payload["results"]
    lines = [
        *_intro_lines(payload["generated_at"]),
        *_headline_lines(results),
        "",
        "## Trade setups",
        "",
        *_setup_table(results),
        "",
        "## Verdicts",
        "",
        *_verdict_table(results),
        "",
        *_timing_lines(results),
        "Raw data: `trade_setups_v2.json`. Re-run: "
        "`uv run python tests/pred_eng_v2/live_trade_setups_v2.py` from `backend/`.",
        "",
    ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")

def main() -> None:
    now = datetime.now(UTC)
    setups = [build_setup(spec, now) for spec in SETUPS]
    print("Settling v1 (new connection per request) ...", flush=True)
    v1_runs = settle_batch_v1(setups)
    print("Settling v2 (shared connection) ...", flush=True)
    v2_runs = settle_batch_v2(setups)
    print("Building ground truth from every 1m candle ...", flush=True)
    results = []
    for setup, v1, v2 in zip(setups, v1_runs, v2_runs):
        truth, truth_candles = ground_truth(setup)
        results.append(compare(setup, truth, truth_candles, v1, v2))
    payload = {"generated_at": now.isoformat(), "results": results}
    JSON_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_report(payload)
    print(f"Wrote {JSON_PATH}\nWrote {REPORT_PATH}")

if __name__ == "__main__":
    main()
