# View Refresh & Cron Commands

**Version:** 1.0.0  
**Last Updated:** January 2026

This doc lists SQL commands, backend cron endpoints, and how to schedule them. Regular views (`post_stats`) are computed on each query and do not need refreshing.

---

## Overview: Backend cron endpoints

The backend exposes **two cron endpoints**. Both require `CRON_SECRET` for auth.

| Endpoint | What it does | Suggested schedule |
|----------|--------------|--------------------|
| `GET /api/v1/cron/daily` | DB health check + **refresh all materialized views** + stale session cleanup | Once per day (e.g. 05:00 UTC) |
| `GET /api/v1/cron/sessions` | Stale session cleanup only | Every 30–60 min |

**There is no separate route for view refresh** – it is built into `/cron/daily`. The views (`daily_metrics`, `engagement_metrics`, `trending_tickers`) are refreshed when you call the daily endpoint.

**Flow:**
- Call `/cron/daily` once per day → views get refreshed, stale sessions get closed.
- If you want more accurate session end times, also call `/cron/sessions` every 30–60 min. This is optional; the daily cron already closes stale sessions once per day.

---

## Materialized views to refresh

| View | Purpose | Refresh command | Suggested schedule |
|------|----------|-----------------|--------------------|
| `trending_tickers` | Ticker mention counts (24h + total) | `REFRESH MATERIALIZED VIEW trending_tickers;` | Hourly (e.g. cron) |
| `daily_metrics` | Daily aggregates (DAU, MAU, posts, new users) | `REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;` | Daily (e.g. after midnight) |
| `engagement_metrics` | Global engagement stats (totals, averages) | `REFRESH MATERIALIZED VIEW engagement_metrics;` | Daily or on demand |

---

## Commands

Run these against your database (e.g. via `psql`, Supabase SQL Editor, or a migration/scheduled job).

### Trending tickers (no exclusive lock)

```sql
REFRESH MATERIALIZED VIEW trending_tickers;
```

Use when: You want fresh “trending” data. Safe to run frequently; takes a short exclusive lock.

### Daily metrics (concurrent refresh)

Requires the unique index `idx_daily_metrics_date` (created in migration `0002_functions_views`).

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
```

Use when: After daily rollover. `CONCURRENTLY` avoids blocking reads but takes longer.

### Engagement metrics

```sql
REFRESH MATERIALIZED VIEW engagement_metrics;
```

Use when: After heavy write activity or once per day for reporting. Blocks reads briefly.

---

## Example cron jobs

**Hourly – trending tickers**

```bash
0 * * * * psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW trending_tickers;"
```

**Daily – daily_metrics (e.g. 00:05)**

```bash
5 0 * * * psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;"
```

**Daily – engagement_metrics (e.g. 00:10)**

```bash
10 0 * * * psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW engagement_metrics;"
```

Replace `psql "$DATABASE_URL"` with your actual connection method (Supabase SQL, pooler URL, etc.).

---

## Daily cron: `/api/v1/cron/daily`

Does everything in one call:

1. **DB health check** – Keeps Supabase prod active (avoids 7-day inactivity pause).
2. **Stale session cleanup** – Marks sessions as ended if inactive 30+ min.
3. **Refresh all materialized views** – `daily_metrics` (CONCURRENTLY), `engagement_metrics`, `trending_tickers`.

**Endpoint:** `GET /api/v1/cron/daily`  
**Auth:** `CRON_SECRET` via one of:

- Header: `Authorization: Bearer <CRON_SECRET>`
- Header: `X-Cron-Secret: <CRON_SECRET>`
- Query: `?secret=<CRON_SECRET>`

**One cron job calling this endpoint is enough** for views + sessions. Run once per day.

---

### Vercel Cron setup (for daily)

1. Add **`CRON_SECRET`** to your Vercel project env (e.g. `openssl rand -hex 32`).
2. Add a **serverless route** that runs on schedule and calls your backend with the secret (Vercel Cron does not add custom headers to the request it sends). For example, a route that runs on the cron schedule and does:
   - `fetch(yourBackendUrl + '/api/v1/cron/daily', { headers: { 'X-Cron-Secret': process.env.CRON_SECRET } })`
3. In **`vercel.json`** (in the repo that deploys the backend), add:

```json
{
  "crons": [
    {
      "path": "/api/cron-daily",
      "schedule": "0 5 * * *"
    }
  ]
}
```

- **`schedule`:** `0 5 * * *` = 05:00 UTC daily.
- **`path`:** Must be the serverless route that **you** implement (e.g. `/api/cron-daily`) and that calls `GET /api/v1/cron/daily` with the `X-Cron-Secret` header from env. If your backend is a single serverless function that already serves `/api/v1/cron/daily`, use that path and ensure the handler sends the secret (e.g. from env) when Vercel invokes it (e.g. by checking a Vercel cron header and then adding the secret to an internal call, or by reading the secret from env and forwarding).

**Alternative – external cron (e.g. cron-job.org):** Call the endpoint yourself and send the secret:

```bash
curl -H "X-Cron-Secret: $CRON_SECRET" "https://your-api.vercel.app/api/v1/cron/daily"
```

Or with query param (if the scheduler can’t set headers):

```text
GET https://your-api.vercel.app/api/v1/cron/daily?secret=YOUR_CRON_SECRET
```

---

## Sessions cron: `/api/v1/cron/sessions` (optional)

Closes user sessions inactive for 30+ minutes (e.g. user closed tab without logging out).

**Endpoint:** `GET /api/v1/cron/sessions`  
**Auth:** Same as daily – `CRON_SECRET` via `Authorization: Bearer`, `X-Cron-Secret`, or `?secret=`

**When to use:** The daily cron already closes stale sessions once per day. Add this only if you want **more accurate session end times** (e.g. sessions closed within 30–60 min instead of once per day).

**Schedule:** Every 30–60 minutes (e.g. half-hourly).

**Example Vercel Cron** (add to `vercel.json` crons array):

```json
{
  "path": "/api/cron-sessions",
  "schedule": "*/30 * * * *"
}
```

Create a serverless route `/api/cron-sessions` that calls `GET https://your-backend-url/api/v1/cron/sessions` with `X-Cron-Secret: process.env.CRON_SECRET`.

**Example external cron:**

```bash
curl -H "X-Cron-Secret: $CRON_SECRET" "https://your-api.vercel.app/api/v1/cron/sessions"
```

---

## Regular view (no refresh)

- **`post_stats`** – Standard view; no refresh. Each query runs the underlying `SELECT` and returns current counts.
