# Prediction engine v2 — live trade-setup verification

Generated: `2026-10-11T21:04:47.795281+00:00` (UTC) — Coinbase Exchange, closed windows.

Each setup is settled through the real settle path (`_try_settle_prediction` → smart-ladder evaluate → `apply_evaluation_to_prediction`):

- **v1:** new HTTPS connection per Coinbase request (previous behaviour).
- **v2:** one shared connection for the batch (scheduled settle job).
- **Ground truth:** every 1-minute candle in the window scanned in order, independent of the engine. A candle touching stop and target counts as a loss; an expired exit is the close of the last 1-minute candle fully closed at or before expiry.

- v1 and v2 verdicts identical: **yes**
- Outcomes (win / loss / expired) match ground truth: **yes**
- Every field incl. expiry exit price matches ground truth: **yes**
- Net result of the six calls (ground truth): **-0.03R**

## Trade setups

| # | Setup | Window | Entry | Stop | Target | R:R |
|---|---|---|---|---|---|---|
| 1 | BTC swing long (long) | 24h from 2026-10-10T20:23:00Z | 82,974.6100 | 81,729.9909 | 85,463.8483 | 2.0 |
| 2 | ETH breakdown short (short) | 48h from 2026-10-09T20:23:00Z | 2,478.6200 | 2,528.1924 | 2,379.4752 | 2.0 |
| 3 | SOL momentum long (long) | 12h from 2026-10-11T08:23:00Z | 109.2800 | 107.0944 | 112.5584 | 1.5 |
| 4 | BTC intraday short (short) | 6h from 2026-10-11T14:23:00Z | 82,956.3200 | 83,619.9706 | 81,960.8442 | 1.5 |
| 5 | ETH scalp long (long) | 2h from 2026-10-11T18:23:00Z | 2,538.9500 | 2,523.7163 | 2,564.3395 | 1.67 |
| 6 | DOGE swing long (long) | 36h from 2026-10-10T08:23:00Z | 0.0860 | 0.0834 | 0.0903 | 1.67 |

## Verdicts

| # | Ground truth (1m scan) | Hit at | Return | R | v1 | v2 |
|---|---|---|---|---|---|---|
| 1 | **expired** @ 83,572.3200 | — | +0.72% | +0.48R | match | match |
| 2 | **loss** @ 2,528.1924 | 2026-10-11T15:40:00Z | -2.00% | -1.00R | match | match |
| 3 | **win** @ 112.5584 | 2026-10-11T17:37:00Z | +3.00% | +1.50R | match | match |
| 4 | **loss** @ 83,619.9706 | 2026-10-11T15:56:00Z | -0.80% | -1.00R | match | match |
| 5 | **expired** @ 2,533.8300 | — | -0.20% | -0.34R | match | match |
| 6 | **expired** @ 0.0868 | — | +0.98% | +0.33R | match | match |

## Cost: engine vs brute force, v1 vs v2

| # | Brute force: requests / candles | Engine: requests / candles | v1 ms | v2 ms |
|---|---|---|---|---|
| 1 | 5 / 1,441 | 6 / 37 | 6,133 | 196 |
| 2 | 10 / 2,881 | 9 / 54 | 8,917 | 162 |
| 3 | 3 / 721 | 7 / 48 | 6,577 | 123 |
| 4 | 2 / 361 | 6 / 40 | 6,740 | 101 |
| 5 | 1 / 121 | 4 / 31 | 3,917 | 72 |
| 6 | 7 / 1,858 | 6 / 38 | 4,420 | 96 |
| **Total** | | | **36,703** | **750** |

Brute force is what verification would cost without the smart ladder (every 1m candle).
Engine counts are identical for v1 and v2; only the connection handling differs.

## Time breakdown per setup

Requests = time inside Coinbase requests (handshake + download). Other = total minus
requests: opening a new HTTPS client per request in v1, plus the engine itself (~1 ms).

| # | Requests | v1 requests | v1 other | v1 total | v2 requests | v2 other | v2 total |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 4,571 ms | 1562.2 ms | 6,133 ms | 195 ms | 1.0 ms | 196 ms |
| 2 | 9 | 6,528 ms | 2388.1 ms | 8,917 ms | 161 ms | 1.1 ms | 162 ms |
| 3 | 7 | 4,741 ms | 1835.6 ms | 6,577 ms | 122 ms | 0.9 ms | 123 ms |
| 4 | 6 | 5,198 ms | 1541.3 ms | 6,740 ms | 100 ms | 0.7 ms | 101 ms |
| 5 | 4 | 2,843 ms | 1073.3 ms | 3,917 ms | 71 ms | 0.7 ms | 72 ms |
| 6 | 6 | 2,875 ms | 1544.9 ms | 4,420 ms | 95 ms | 0.7 ms | 96 ms |

Raw data: `trade_setups_v2.json`. Re-run: `uv run python tests/pred_eng_v2/live_trade_setups_v2.py` from `backend/`.
