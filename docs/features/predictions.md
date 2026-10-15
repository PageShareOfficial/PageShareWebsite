# Predictions

## Why it exists

Analysts publish short-term crypto trade calls (long/short, target, stop, expiry). Calls are
immutable, priced from Coinbase at submit time, settled automatically against Coinbase candles,
and optionally hashed onto Polygon as tamper-evident proof. Analysts are ranked by **Net RR over
the last 30 days**; investors pay to see who they are and dig into their track record.

## How it works

### 1. Submit — `POST /api/v1/predictions`

- **Who:** only users with an active **analyst** plan (`is_analyst_user`), else 403.
- **Daily cap:** `MAX_PREDICTIONS_PER_DAY` per local calendar day. Timezone order:
  `X-Client-Timezone` header → profile timezone → UTC. Over cap → 429.
- **Price lock:** UI calls `GET /predictions/live-price` and shows a lock. Server requires
  `lock_started_at <= now <= lock_started_at + LOCK_DURATION`.
- **Entry price is re-read server-side** from the Coinbase ticker (`{ASSET}-USD`); the client
  value is overwritten. Coinbase down → 503; unknown asset → 400.
- **Validation** (`validate_submission_payload`):
  - long: `target > entry > stop`; short: `target < entry < stop`
  - target ≥ `MIN_TARGET_MOVE_PCT` from entry, stop ≥ `MIN_STOP_MOVE_PCT` from entry
  - setup RR = `|target − entry| / |entry − stop|` ≥ `MIN_RISK_REWARD`
  - expiry between `start + MIN_EXPIRY_OFFSET` and `start + MAX_EXPIRY_OFFSET`
  - confidence in `[MIN_CONFIDENCE, MAX_CONFIDENCE]`, thesis ≤ `MAX_THESIS_LENGTH`
- After insert: content hash computed, anchoring scheduled (see 4).

### 2. Settle (evaluation engine)

A prediction is due when `status='active' AND outcome IS NULL AND expiry_at <= now`.
There is **no early settlement** — only after expiry.

Engine rules (`prediction_evaluate_engine.py`):
- Long hits target when candle `high >= target`, stop when `low <= stop` (short mirrored).
- First candle touching a level decides. **Both levels in one candle = loss**
  (`dual_hit_same_candle`).
- Neither hit → `expired`; exit price = close of last fully-closed 1m candle at/before expiry
  (looks back `EXPIRY_PRICE_LOOKBACK`).
- `return_pct` is a fraction: long `(exit − entry)/entry`, short `(entry − exit)/entry`.

**Smart ladder:** fetch coarse candles first, zoom into finer intervals only where a level was
touched, down to 1m. Starting interval depends on window length (`LADDER_FROM_1D/6H/1H/15M`).
Candles that opened before `start_time` are re-checked at a finer interval (never trusted whole).

Triggers:
- **Cron** `GET /api/v1/cron/settle-predictions` — up to `SETTLE_DUE_PER_RUN` rows within
  `SETTLE_RUN_TIME_BUDGET_SECONDS`, never-attempted first, then oldest attempt. See
  [cron jobs](../operations/cron-jobs.md).
- **Lazy** — the owner opening their own prediction detail settles it if due.

### 3. Rank & analytics

- Net RR contribution per call: win `+setupRR`, loss `−setupRR`, expired `0`.
- Net RR (30d) = sum over calls resolved in the last `ANALYTICS_LOOKBACK_DAYS`.
- Win rate = `wins / (wins + losses)` — **expired calls excluded**.
- Leaderboard includes every active analyst (even with zero calls), sorted by Net RR desc.
  Computed in Python per request — no materialized views.

Who sees what:

| Viewer | Leaderboard | Analytics |
|---|---|---|
| Investor | all identities | any analyst's dashboard, list, detail |
| Analyst | own row only (peers masked as `Analyst_{rank}`) | own dashboard |
| Free / anonymous | masked | upgrade modal |

### 4. Hash & Polygon anchor

- SHA-256 over canonical JSON of the call's fields + ids + `HASH_VERSION`
  (thesis/media excluded). Computed once at submit.
- If Polygon is configured, a relayer calls `PredictionAnchor.anchor(...)` (owner-only contract).
- Retries via cron `GET /cron/anchor-predictions` (`ANCHOR_RETRY_BATCH_LIMIT` per run). A row with
  an existing tx hash is only confirmed, never re-broadcast.

## Knobs to tweak

| Constant | File | Value | Meaning |
|---|---|---|---|
| `LOCK_DURATION` | `backend/app/services/prediction_constants.py` | 3 min | price-lock validity |
| `MIN_EXPIRY_OFFSET` / `MAX_EXPIRY_OFFSET` | same | 30 min / 48 h | allowed expiry window |
| `MIN_RISK_REWARD` | same | 1.2 | min setup RR |
| `MIN_TARGET_MOVE_PCT` / `MIN_STOP_MOVE_PCT` | same | 1% / 0.5% | min distance from entry |
| `MAX_PREDICTIONS_PER_DAY` | same | 5 | daily cap |
| `MIN_CONFIDENCE` / `MAX_CONFIDENCE` | same | 0.5 / 0.95 | confidence range |
| `MAX_THESIS_LENGTH` | same | 300 | also a DB CHECK |
| `SETTLE_DUE_PER_RUN` / `SETTLE_RUN_TIME_BUDGET_SECONDS` | same | 20 / 25 s | cron batch |
| `ANCHOR_RETRY_BATCH_LIMIT` | same | 20 | anchor retries per run |
| `ANALYTICS_LOOKBACK_DAYS` | same | 30 | ranking window |
| `LADDER_FROM_*`, `EXPIRY_PRICE_LOOKBACK` | `backend/app/services/prediction_evaluate_constants.py` | — / 15 min | search ladders |
| `HASH_VERSION` | `backend/app/services/prediction_hash_service.py` | `pageshare:prediction:v1` | bump if hashed fields change |
| `LIVE_PRICE_RATE_LIMIT_PER_MINUTE` | `backend/app/api/prediction_api_constants.py` | 30 | live-price endpoint |

> **Frontend mirrors the rules** in `frontend/utils/predictions/predictionRules.ts`
> (lock, expiry window, min target/stop distance, confidence, thesis length). Change both sides
> together.

## Files involved

**Backend**
- `app/api/predictions.py` — all `/predictions` routes
- `app/services/prediction_service.py` — submit flow, analyst gate, daily quota, live price
- `app/services/prediction_validation_service.py` — pure submission rules
- `app/services/prediction_constants.py`, `prediction_evaluate_constants.py` — the knobs
- `app/services/prediction_evaluate_engine.py` — pure evaluation engine + smart ladder
- `app/services/prediction_settle_service.py` — single and batch settlement
- `app/services/prediction_rr_utils.py` — setup RR, Net RR contribution
- `app/services/prediction_analytics_service.py`, `prediction_analytics_predictions_service.py` — dashboards, lists, detail
- `app/services/prediction_leaderboard_service.py` — ranking + identity masking
- `app/services/prediction_hash_service.py`, `polygon_anchor_service.py`, `contracts/PredictionAnchor.sol` — proof
- `app/services/coinbase_market_service.py`, `coinbase_assets.py` — prices and candles
- `app/services/saved_analyst_service.py`, `app/api/saved_analysts.py` — investor saved analysts

**Frontend**
- `app/(app)/predictions/`, `app/(app)/submit-prediction/`, `app/(app)/myanalysts/`, `app/analytics/`
- `components/app/predictions/` — submit form, dashboard, leaderboard, analytics
- `hooks/predictions/usePredictionsView.ts` — picks free / analyst / investor view
- `lib/api/predictionApi.ts` — API calls (sends `X-Client-Timezone`)
- `utils/predictions/predictionRules.ts` — client copy of the rules

**Env vars:** `POLYGON_RPC_URL`, `POLYGON_RELAYER_PRIVATE_KEY`, `POLYGON_ANCHOR_CONTRACT_ADDRESS`,
`POLYGON_CHAIN_ID`, `CRON_SECRET`. Coinbase uses the public API (no key).

## Gotchas

- The UI's locked price is display-only; a setup can pass in the UI and fail server RR checks if
  price moved.
- Daily cap uses a client-supplied timezone header, and count + insert are not atomic.
- Only the owner's detail view lazy-settles; investor views don't. Without cron (e.g. dev),
  predictions settle only when the owner opens them.
- A loss subtracts the full setup RR (not 1R) — intentional per the original spec.
- Status `invalid` exists in the schema but nothing sets it today.
- Once anchored, the API returns the Polygon tx hash in the `content_hash` field.
- Dashboard rank and leaderboard rank can differ on ties (different tie-breaks).
- Live-price rate limit is in-memory per instance.
