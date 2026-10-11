# View Refresh & Cron Jobs

**Version:** 1.2.0  
**Last Updated:** October 2026

This doc covers every scheduled job in PageShare: the backend cron endpoints, how they are scheduled, how to run them by hand, and the SQL for refreshing materialized views. Regular views (`post_stats`) are computed on each query and do not need refreshing.

---

> **All cron jobs currently run on production only.**
>
> - **Vercel Cron** (`frontend/vercel.json`) only fires on **production** deployments, on every Vercel plan. It never runs on preview or dev deployments.
> - **GitHub Actions** (`.github/workflows/cron-sessions.yml`) scheduled runs always use the **`production`** GitHub environment, which points at the production backend.
> - **No dev or preview cron is configured.** In dev, a prediction is still settled when someone opens it. Predictions nobody opens stay pending, which is fine for a dev database.
> - **To run a job against dev or local**, call the endpoint yourself (see [Running a job manually](#running-a-job-manually-dev--local)). The workflow also has a manual `dev` / `preview` option, but it only works after those GitHub environments are created (see [GitHub Actions setup](#github-actions-every-30-min)).

---

## Overview

The backend exposes **four cron endpoints** under `/api/v1/cron`. All require `CRON_SECRET` (see [Authentication](#authentication)).

| Endpoint | What it does | Scheduler (production only) | Schedule |
|----------|--------------|-----------------------------|----------|
| `GET /api/v1/cron/daily` | DB health check, stale session cleanup, refresh `daily_metrics` + `engagement_metrics` | Vercel Cron via frontend proxy `/api/cron-daily` | Daily, 05:00 UTC |
| `GET /api/v1/cron/sessions` | Stale session cleanup only | GitHub Actions | Every 30 min |
| `GET /api/v1/cron/anchor-predictions` | Retries Polygon hash anchoring for predictions not yet confirmed on-chain | GitHub Actions | Every 30 min |
| `GET /api/v1/cron/settle-predictions` | Settles expired predictions for all users (win / loss / expired) | GitHub Actions | Every 30 min |

The three 30-minute jobs run **in order** in one workflow run: sessions → anchor-predictions → settle-predictions. They share one workflow so they never compete for GitHub Actions concurrency.

`trending_tickers` is **not** refreshed by any cron. Add an hourly job if the frontend starts using it (see [Materialized views](#materialized-views)).

---

## Authentication

Every cron endpoint checks `CRON_SECRET` (backend env var, read in `app/config.py`). Send it in **one** of these headers:

- `X-Cron-Secret: <CRON_SECRET>`
- `Authorization: Bearer <CRON_SECRET>`

Query params (`?secret=`) are **not** accepted, so the secret never ends up in logs or referrers.

| Situation | Response |
|-----------|----------|
| Backend `CRON_SECRET` is empty | `403` on every call (cron is effectively disabled) |
| Header missing or wrong | `403 {"detail": "Invalid or missing cron secret"}` |
| Secret correct | `200` with the endpoint's JSON body |

---

## Scheduling

### Vercel Cron (daily)

1. **`frontend/vercel.json`** schedules `/api/cron-daily` at `0 5 * * *` (05:00 UTC). Once a day fits the Vercel Hobby plan.
2. **Frontend env (Vercel, Production):** set **`CRON_SECRET`** (same value as the backend) and **`NEXT_PUBLIC_API_URL`** (backend base URL).
3. Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations. The proxy (`frontend/app/api/cron-daily/route.ts`) rejects any other request with `403`, then calls backend `/api/v1/cron/daily` with `X-Cron-Secret`.

Proxy responses: `503` if `CRON_SECRET` or the backend URL is missing, `502` if the backend is unreachable, otherwise the backend's status and body.

### GitHub Actions (every 30 min)

Workflow: **`.github/workflows/cron-sessions.yml`** ("Cron – backend jobs"), schedule `*/30 * * * *`.

**Setup:** GitHub repo → Settings → Environments → **`production`** → add these as **environment secrets** (not repo secrets):

- **`CRON_SECRET`**: same value as the production backend's `CRON_SECRET`.
- **`CRON_BACKEND_URL`**: production backend base URL, no trailing slash (e.g. `https://your-backend.vercel.app`).

**Environments:** scheduled runs always use `production`. Manual runs (Actions → "Cron – backend jobs" → Run workflow) let you pick `production`, `dev` or `preview`. For `dev` / `preview` to work, create GitHub environments with those exact names and the same two secrets. The target backend must be publicly reachable: not `localhost`, and not behind Vercel Deployment Protection.

**Pass / fail rule:** each step fails only when the endpoint returns a non-`200` HTTP status (e.g. `403` wrong secret, `5xx` backend down). The steps use `continue-on-error`, so one failing job does not stop the others; a final step marks the run failed if any step failed.

> **Known gap:** the endpoints return HTTP `200` with `{"ok": false, "error": ...}` when the job itself fails (e.g. database error). The workflow does not read the body, so those runs still show green. Check backend logs (`pageshare.cron`) when numbers look wrong.

**GitHub minutes:** GitHub bills each job rounded **up** to a whole minute, so each run costs at least 1 minute: 48 runs/day × 30 days ≈ **1,440 min/month**. Within the free 2,000 min/month for private repos (unlimited for public repos), but adding more scheduled environments would exceed it.

### External scheduler (alternative)

Any scheduler that can set headers works (e.g. cron-job.org):

```bash
curl -H "X-Cron-Secret: $CRON_SECRET" "https://your-backend.vercel.app/api/v1/cron/daily"
```

---

## Endpoint reference

### Daily: `GET /api/v1/cron/daily`

Runs once per day via Vercel Cron.

1. **DB health check**: `SELECT 1`. Keeps the Supabase production database active (avoids the 7-day inactivity pause).
2. **Stale session cleanup**: same as the sessions cron below.
3. **Refresh materialized views**: `daily_metrics` (`CONCURRENTLY`) and `engagement_metrics`.

Each step reports its own result, so one failing step does not hide the others:

```json
{
  "ok": true,
  "results": {
    "db_health": true,
    "stale_sessions": 3,
    "daily_metrics": "ok",
    "engagement_metrics": "ok"
  }
}
```

`ok` reflects the DB health check only. A failed refresh shows its error message in place of `"ok"`.

### Sessions: `GET /api/v1/cron/sessions`

Closes sessions left open (e.g. the user closed the tab without logging out), so session end times and analytics stay accurate.

- **Rule:** any session with no `session_end` whose `session_start` is more than **30 minutes** ago (`INACTIVITY_MINUTES` in `app/services/session_service.py`) gets `session_end` set to *now − 30 min*.
- **Response:** `{"ok": true, "closed": <count>}` or `{"ok": false, "error": "..."}`.

### Anchor predictions: `GET /api/v1/cron/anchor-predictions`

Retries publishing prediction hashes to Polygon for rows whose anchoring did not finish at submit time.

- **Picks:** up to **20** predictions (`ANCHOR_RETRY_BATCH_LIMIT`) with a content hash and `anchor_status` of `pending`, `failed` or `submitted`, oldest first.
- **Per row:** confirms an existing transaction if one was submitted, otherwise broadcasts a new one and waits for the receipt (up to 120 s).
- **Response:** `{"ok": true, "results": {"skipped": false, "attempted": n, "confirmed": n, "failed": n}}`. If Polygon env vars (`POLYGON_RPC_URL`, relayer key, etc.) are not set: `{"ok": true, "results": {"skipped": true, "reason": "not_configured"}}`.

### Settle predictions: `GET /api/v1/cron/settle-predictions`

Settles expired predictions for **all users**, so outcomes and the leaderboard update even when nobody opens the prediction.

**Which predictions are "due":** `status = 'active'`, `outcome IS NULL`, and `expiry_at <= now`.

**Queue order:** never-attempted predictions first (`settle_attempted_at IS NULL`), then the least recently attempted, then the earliest expiry. A prediction that keeps failing moves to the back of the queue instead of blocking the others. Backed by the partial index `ix_predictions_settle_queue`.

**Per run:**

| Setting | Value | Defined in |
|---------|-------|------------|
| Max predictions | 20 | `SETTLE_DUE_PER_RUN` |
| Time budget | 25 s | `SETTLE_RUN_TIME_BUDGET_SECONDS` |

Both live in `app/services/prediction_constants.py`. The time budget is checked **before** starting each prediction, so the run stays well inside the serverless request timeout. All Coinbase candle requests in a run share **one HTTPS connection** (about 0.1 s per prediction).

**For each prediction:**

1. Stamp `settle_attempted_at` with the current time.
2. Fetch Coinbase candles from `start_time` to `expiry_at` and find which level was hit first: target → `win`, stop → `loss`, neither → `expired`.
3. For `expired`, the exit price is the close of the **last 1-minute candle fully closed at or before expiry**.
4. Save the outcome, hit price/time and return %, then commit.

**On failure** (Coinbase unavailable, unsupported asset, or no usable candle data), the prediction stays `active`, the attempt time is saved, and a warning is logged (`Prediction settle skipped id=... asset=...`). The next run retries it after the never-attempted rows.

**Response:**

```json
{"ok": true, "attempted": 12, "settled": 11, "failed": 1, "elapsed_ms": 1840}
```

- `attempted`: predictions processed this run (can be below 20 if the queue was shorter or the time budget ran out).
- `settled`: predictions now resolved. `failed` = `attempted − settled`.
- On an unexpected error (e.g. database unavailable): `{"ok": false, "error": "..."}`, logged with a stack trace.

Each run logs one line to `pageshare.cron`:
`Scheduled prediction settle attempted=12 settled=11 failed=1 elapsed_ms=1840`. Use it to tune the batch size.

**Requires migration `0013_prediction_settle_attempt`** (adds `settle_attempted_at` and the queue index). Without it, every run returns `ok: false`.

**Other settle path:** opening a prediction on the analyst prediction page settles that single prediction if it is due. Together, these are the only two ways predictions get settled.

---

## Running a job manually (dev / local)

No cron runs outside production, so trigger jobs by hand when testing:

1. Set `CRON_SECRET=<any-local-value>` in `backend/.env` and restart uvicorn.
2. Make sure the dev database is migrated: `uv run alembic upgrade head` from `backend/`.
3. Call the endpoint you need (PowerShell):

```powershell
curl.exe -H "X-Cron-Secret: <any-local-value>" http://localhost:8000/api/v1/cron/settle-predictions
curl.exe -H "X-Cron-Secret: <any-local-value>" http://localhost:8000/api/v1/cron/sessions
curl.exe -H "X-Cron-Secret: <any-local-value>" http://localhost:8000/api/v1/cron/anchor-predictions
curl.exe -H "X-Cron-Secret: <any-local-value>" http://localhost:8000/api/v1/cron/daily
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `403` from a backend cron endpoint | `CRON_SECRET` differs between caller and backend (check for trailing spaces/newlines), or the backend's `CRON_SECRET` is empty |
| `401` on a preview URL from GitHub Actions | Vercel Deployment Protection is blocking the request before it reaches FastAPI |
| Workflow green but nothing changed | Endpoint returned `{"ok": false}` with HTTP 200 (see [Known gap](#github-actions-every-30-min)); check backend logs |
| Settle cron returns `ok: false` mentioning `settle_attempted_at` | Migration `0013` has not been applied to that database |
| Settle `failed` count stays high | Coinbase outage or unsupported asset; look for `Prediction settle skipped` warnings |
| Anchor results show `"skipped": true` | Polygon env vars not set on that backend (expected in dev) |
| Daily cron never runs on preview | Expected: Vercel Cron only runs on production deployments |

---

## Materialized views

| View | Purpose | Refresh command | Refreshed by |
|------|---------|-----------------|--------------|
| `daily_metrics` | Daily aggregates (DAU, MAU, posts, new users) | `REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;` | Daily cron |
| `engagement_metrics` | Global engagement stats (totals, averages) | `REFRESH MATERIALIZED VIEW engagement_metrics;` | Daily cron |
| `trending_tickers` | Ticker mention counts (24h + total) | `REFRESH MATERIALIZED VIEW trending_tickers;` | **Nothing yet**; refresh hourly if used |

### Commands

Run these against your database (e.g. via `psql` or the Supabase SQL Editor).

**Daily metrics (concurrent refresh).** Requires the unique index `idx_daily_metrics_date` (created in migration `0002_functions_views`). `CONCURRENTLY` avoids blocking reads but takes longer.

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
```

**Engagement metrics.** Blocks reads briefly; run after heavy write activity or once per day.

```sql
REFRESH MATERIALIZED VIEW engagement_metrics;
```

**Trending tickers.** Takes a short exclusive lock; safe to run frequently.

```sql
REFRESH MATERIALIZED VIEW trending_tickers;
```

### Example system cron entries (if not using the endpoints)

```bash
0 * * * *  psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW trending_tickers;"
5 0 * * *  psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;"
10 0 * * * psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW engagement_metrics;"
```

Replace `psql "$DATABASE_URL"` with your connection method (Supabase SQL, pooler URL, etc.).

---

## Regular view (no refresh)

- **`post_stats`**: standard view; no refresh needed. Each query runs the underlying `SELECT` and returns current counts.
