# View Refresh Commands

**Version:** 1.0.0  
**Last Updated:** January 2026

This doc lists SQL commands and schedules for refreshing materialized views. Regular views (`post_stats`) are computed on each query and do not need refreshing.

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

## Backend cron endpoint (recommended)

The backend exposes a **single daily cron endpoint** that does everything in one call:

1. **DB touch** – Runs a simple query so Supabase sees activity (avoids 7-day inactivity pause).
2. **Refresh all materialized views** – `daily_metrics` (CONCURRENTLY), `engagement_metrics`, `trending_tickers`.

**One Vercel Cron job is enough** – no need to schedule separate jobs per view.

**Endpoint:** `GET /api/v1/cron/daily`  
**Auth:** Set `CRON_SECRET` in your env; send it with every request using one of:

- Header: `Authorization: Bearer <CRON_SECRET>`
- Header: `X-Cron-Secret: <CRON_SECRET>`
- Query: `?secret=<CRON_SECRET>` (for schedulers that can’t set headers)

---

### Vercel Cron setup

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

Run **once per day**. The endpoint runs `db_health_check()` then refreshes all three materialized views.

---

## Regular view (no refresh)

- **`post_stats`** – Standard view; no refresh. Each query runs the underlying `SELECT` and returns current counts.
