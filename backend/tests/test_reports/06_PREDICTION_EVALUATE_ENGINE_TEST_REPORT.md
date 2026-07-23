# Prediction evaluate engine — test cases & live search reports

Source (unit rules): `backend/tests/test_prediction_evaluate_engine.py`  
Engine: `backend/app/services/prediction_evaluate_engine.py`

Smart-search **against Coinbase** is not mocked in pytest. Use live scripts:

- `tests/test_live_evaluate_zoom_trace.py` → `tests/test_reports/08_PREDICTION_LIVE_EVALUATE_ZOOM_TRACE.md`
- `tests/test_live_evaluate_short_window_floor.py` → `tests/test_reports/09_PREDICTION_LIVE_SHORT_WINDOW_FLOOR.md`
- Smart ladder (no I/O): `tests/test_reports/07_PREDICTION_SMART_LADDER_TEST_REPORT.md`

```bash
cd backend
$env:PYTHONPATH = "."
python -m pytest tests/test_prediction_evaluate_engine.py -q
```

---

## Suite summary (unit — outcome rules)

| Metric | Value |
|--------|--------|
| Tests | 9 |
| Last run | 2026-07-20 |
| Result | **9 passed** |
| Scope | Candle rules, binary helpers, floor helper, apply idempotency |

---

## Unit test cases

| # | Test | Purpose | Result |
|---|------|---------|--------|
| 1 | `test_binary_search_lower_bound_and_slice` | Time bounds / window slice | Pass |
| 2 | `test_long_win_target_first` | Long target first → win | Pass |
| 3 | `test_long_loss_stop_first` | Long stop first → loss | Pass |
| 4 | `test_short_win_and_loss` | Short win / loss | Pass |
| 5 | `test_dual_hit_same_candle_is_loss` | Dual-hit → loss | Pass |
| 6 | `test_expired_uses_last_close_hit_at_null` | Expired; `hit_at` null | Pass |
| 7 | `test_empty_candles_raises` | Empty series → error | Pass |
| 8 | `test_apply_is_idempotent` | Write once | Pass |
| 9 | `test_floor_to_interval_6h` | Bucket floor for mid-bar starts | Pass |

---

## Timing fields (`EvaluateTimings`)

Used by live settle / docs scripts (real Coinbase RTT).

| Field | Meaning |
|-------|---------|
| `fetch_ms_by_interval` | Per-interval candle fetch time (ms) |
| `fetch_ms_total` | Sum of interval fetches |
| `search_ms` | Smart-search wall time (includes fetches) |
| `apply_ms` | Persist evaluation onto prediction row |
| `total_ms` | End-to-end evaluate wrapper |
| `candle_fetches` | Number of candle API calls |
| `candles_scanned` | Candles walked across all fetches |

---

## Real-world timings (live Coinbase)

Measured **2026-07-20** against `api.exchange.coinbase.com` for **BTC**.

| Scenario | Window | Outcome | Fetches | total |
|----------|--------|---------|---------|-------|
| Expire early (wide) | 6h | expired | 1× coarse | **~0.8–1.4s** |
| Zoom → win | 6h | win | `6h→1h→15m→1m` | **~5.2s** |
| Zoom → loss | 6h | loss | same ladder | **~3.1s** |

Per-interval example (zoom win): `6h:872ms`, `1h:1373ms`, `15m:1382ms`, `1m:1606ms`.

**UI:** ~1s expire-early; ~3–6s full zoom. List settle scales with N due rows.

### Leading bucket gap (fixed)

Floor fetch to bucket open; nested-refine leading partial; resume later bars.
Live confirmation: `09_PREDICTION_LIVE_SHORT_WINDOW_FLOOR.md` (same folder).

### Smart ladder

See `07_PREDICTION_SMART_LADDER_TEST_REPORT.md` (window length → ladder; no market I/O).

---

## How to refresh

1. Unit rules: `python -m pytest tests/test_prediction_evaluate_engine.py -q`
2. Live zoom: `python tests/test_live_evaluate_zoom_trace.py`
3. Live 30m/1h floor: `python tests/test_live_evaluate_short_window_floor.py`
4. Smart ladder: `python -m pytest tests/test_prediction_smart_ladder.py -v`
