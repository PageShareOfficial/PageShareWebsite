# Prediction engine v2 — live benchmark

Generated: `2026-10-11T20:41:42.396149+00:00` (UTC)  
Asset: **BTC** via Coinbase Exchange  
Cases: **18** (6 window lengths × win / loss / expired), **2 rounds** per mode, mode order alternated each round.

- **v1** = previous behaviour: a new HTTPS connection for every candle request.
- **v2** = shared connection for the whole batch (what the scheduled settle job uses).

Both modes run the same windows and levels back to back, so market conditions match.

## Correctness

All outcomes, hit prices and hit times identical between v1 and v2: **yes**

## Speed

| Metric | v1 new connection | v2 shared connection | v2 faster by |
|---|---|---|---|
| Mean time per prediction | 2,555 ms | 99 ms | 96.1% |
| Median time per prediction | 1,542 ms | 83 ms | 94.6% |
| Mean time per Coinbase request | 484 ms | 19 ms | 96.1% |
| Batch of all cases (one cron run) | 45,997 ms | 1,787 ms | 96.1% |
| Coinbase requests (all rounds) | 190 | 190 | same search path |

Historical v1 reference (reports 08 / 09, 20 Jul 2026, different market and network): **714.5 ms per request** vs v2 today **18.8 ms**.

Network note: the saving comes from skipping a new TLS handshake per request, so it
grows with distance to Coinbase. Run from a developer machine, it overstates the gain on
a server close to Coinbase; outcome equality holds regardless.

## Per case (mean of rounds)

| Case | Outcome (v1 / v2) | Identical | Expected | v1 ms | v2 ms | Faster |
|---|---|---|---|---|---|---|
| `30m_win` | win / win | yes | yes | 1,472 | 58 | 96.0% |
| `30m_loss` | loss / loss | yes | yes | 604 | 35 | 94.2% |
| `30m_expired` | expired / expired | yes | yes | 677 | 39 | 94.2% |
| `1h_win` | win / win | yes | yes | 2,169 | 63 | 97.1% |
| `1h_loss` | loss / loss | yes | yes | 922 | 53 | 94.2% |
| `1h_expired` | expired / expired | yes | yes | 908 | 66 | 92.8% |
| `6h_win` | win / win | yes | yes | 4,333 | 103 | 97.6% |
| `6h_loss` | loss / loss | yes | yes | 1,267 | 69 | 94.5% |
| `6h_expired` | expired / expired | yes | yes | 1,292 | 70 | 94.6% |
| `1d_win` | win / win | yes | yes | 6,184 | 154 | 97.5% |
| `1d_loss` | loss / loss | yes | yes | 2,970 | 116 | 96.1% |
| `1d_expired` | expired / expired | yes | yes | 1,532 | 159 | 89.6% |
| `2d_win` | win / win | yes | yes | 4,534 | 156 | 96.6% |
| `2d_loss` | loss / loss | yes | yes | 1,584 | 84 | 94.7% |
| `2d_expired` | expired / expired | yes | yes | 1,518 | 94 | 93.8% |
| `7d_win` | win / win | yes | yes | 8,371 | 231 | 97.2% |
| `7d_loss` | loss / loss | yes | yes | 4,092 | 153 | 96.3% |
| `7d_expired` | expired / expired | yes | yes | 1,568 | 84 | 94.6% |

"Expected" checks the generated levels produced the intended outcome; a "no" means
the price path differed from the level guess, not an engine error.

Raw runs: `results_v2.json`. Re-run: `uv run python tests/pred_eng_v2/live_benchmark_v2.py` from `backend/`.
