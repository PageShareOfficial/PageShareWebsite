# Smart ladder — test results

Source: `backend/tests/test_prediction_smart_ladder.py`  
Engine: `pick_search_ladder` / `pick_coarse_interval` in
`backend/app/services/prediction_evaluate_engine.py`

No Coinbase / market I/O — window length only.

```bash
cd backend
$env:PYTHONPATH = "."
python -m pytest tests/test_prediction_smart_ladder.py -v
```

---

## Suite summary

| Metric | Value |
|--------|--------|
| Tests | 12 |
| Last run | 2026-07-20 |
| Result | **12 passed** |
| Wall clock | ~0.66s |

---

## Ladder rules under test

| Window length | Expected ladder |
|---------------|-----------------|
| &lt; 1h (e.g. 30m, 45m, 59m) | `15m → 1m` |
| 1h ≤ d &lt; 6h | `1h → 15m → 1m` |
| 6h ≤ d &lt; 1d | `6h → 1h → 15m → 1m` |
| ≥ 1d | `1d → 6h → 1h → 15m → 1m` |

---

## Test cases

| # | Test | Input duration | Expected | Result |
|---|------|----------------|----------|--------|
| 1 | `test_smart_ladder_30_minutes_starts_at_15m` | 30m | `15m → 1m` | **PASSED** |
| 2 | `test_smart_ladder_45_minutes_starts_at_15m` | 45m | `15m → 1m` | **PASSED** |
| 3 | `test_smart_ladder_just_under_1h_starts_at_15m` | 59m | `15m → 1m` | **PASSED** |
| 4 | `test_smart_ladder_1h_starts_at_1h` | 1h | `1h → 15m → 1m` | **PASSED** |
| 5 | `test_smart_ladder_2h_starts_at_1h` | 2h | `1h → 15m → 1m` | **PASSED** |
| 6 | `test_smart_ladder_just_under_6h_starts_at_1h` | 5h 59m | `1h → 15m → 1m` | **PASSED** |
| 7 | `test_smart_ladder_6h_starts_at_6h` | 6h | `6h → 1h → 15m → 1m` | **PASSED** |
| 8 | `test_smart_ladder_12h_and_24h_exclusive_use_6h` | 12h; 23h 59m | `6h → …` | **PASSED** |
| 9 | `test_smart_ladder_1_day_starts_at_1d` | 1d | `1d → 6h → …` | **PASSED** |
| 10 | `test_smart_ladder_2_days_starts_at_1d` | 2d | `1d → 6h → …` | **PASSED** |
| 11 | `test_pick_coarse_matches_ladder_head` | 30m, 2h, 12h, 1d | coarse == ladder[0] | **PASSED** |
| 12 | `test_practical_timegaps_table` | matrix below | head + full ladder | **PASSED** |

---

## Practical timegaps matrix (`test_practical_timegaps_table`)

| Duration | Ladder head | Full ladder | Result |
|----------|-------------|-------------|--------|
| 30m | `15m` | `15m → 1m` | **PASSED** |
| 1h | `1h` | `1h → 15m → 1m` | **PASSED** |
| 2h | `1h` | `1h → 15m → 1m` | **PASSED** |
| 6h | `6h` | `6h → 1h → 15m → 1m` | **PASSED** |
| 24h (1d) | `1d` | `1d → 6h → 1h → 15m → 1m` | **PASSED** |
| 2d | `1d` | `1d → 6h → 1h → 15m → 1m` | **PASSED** |

---

## Pytest output (last run)

```
tests/test_prediction_smart_ladder.py::test_smart_ladder_30_minutes_starts_at_15m PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_45_minutes_starts_at_15m PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_just_under_1h_starts_at_15m PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_1h_starts_at_1h PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_2h_starts_at_1h PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_just_under_6h_starts_at_1h PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_6h_starts_at_6h PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_12h_and_24h_exclusive_use_6h PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_1_day_starts_at_1d PASSED
tests/test_prediction_smart_ladder.py::test_smart_ladder_2_days_starts_at_1d PASSED
tests/test_prediction_smart_ladder.py::test_pick_coarse_matches_ladder_head PASSED
tests/test_prediction_smart_ladder.py::test_practical_timegaps_table PASSED

============================= 12 passed in 0.66s ==============================
```
