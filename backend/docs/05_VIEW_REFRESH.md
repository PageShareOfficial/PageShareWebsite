# View Refresh & Cron Commands

**Version:** 1.0.0  
**Last Updated:** January 2026

This doc lists SQL commands, backend cron endpoints, and how to schedule them. Regular views (`post_stats`) are computed on each query and do not need refreshing.

---

## Overview: Backend cron endpoints

The backend exposes **two cron endpoints**. Both require `CRON_SECRET` for auth.

| Endpoint | What it does | How it’s run |
|----------|--------------|--------------|
| `GET /api/v1/cron/daily` | DB health check + refresh **daily_metrics** + **engagement_metrics** + stale session cleanup | Vercel Cron (frontend proxy), once per day (05:00 UTC) |
| `GET /api/v1/cron/sessions` | Stale session cleanup only (for accurate session end times & analytics) | GitHub Actions, every 30 min |

**Flow:**
- **Daily** (Vercel): Frontend proxy `/api/cron-daily` runs once per day → backend `/cron/daily` does DB touch, views, sessions.
- **Sessions** (GitHub Actions): Workflow runs every 30 min and calls backend `/cron/sessions` directly with `X-Cron-Secret`. Keeps session analytics accurate without needing Vercel Pro.

**trending_tickers** is not refreshed by cron currently; add an hourly job later if the frontend uses it.

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

### Vercel Cron setup (Option A – frontend proxy, implemented)

**Daily cron (Vercel, Hobby‑friendly):**

1. **Frontend env (Vercel):** Add **`CRON_SECRET`** (same value as backend) and **`NEXT_PUBLIC_API_URL`** pointing to the backend.
2. **Frontend** has one cron proxy: **`/api/cron-daily`** → backend `GET /api/v1/cron/daily`. **`frontend/vercel.json`** runs it once per day (`0 5 * * *`) so it works on the Hobby plan.
3. Only requests with the `x-vercel-cron` header are accepted by the proxy.

**Sessions cron (GitHub Actions):**

Sessions run every 30 min via **GitHub Actions** (no Vercel Pro required). See **`.github/workflows/cron-sessions.yml`**. Add repo secrets:

- **`CRON_SECRET`** – same value as backend.
- **`CRON_BACKEND_URL`** – backend base URL, no trailing slash (e.g. `https://your-backend.vercel.app`).

GitHub free tier: 2,000 min/month (private) or unlimited (public). This workflow uses ~0.25 min/run × 48/day × 30 ≈ **360 min/month**, so it stays under the limit.

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

Closes user sessions inactive for 30+ minutes (e.g. user closed tab without logging out). Improves session end times and analytics.

**Endpoint:** `GET /api/v1/cron/sessions`  
**Auth:** `CRON_SECRET` via `Authorization: Bearer` or `X-Cron-Secret` header.

**How it’s run:** GitHub Actions workflow **`.github/workflows/cron-sessions.yml`** runs every 30 min and calls this endpoint. Add repo secrets `CRON_SECRET` and `CRON_BACKEND_URL`. See that file and the “Sessions cron (GitHub Actions)” section above.

---

## Regular view (no refresh)

- **`post_stats`** – Standard view; no refresh. Each query runs the underlying `SELECT` and returns current counts.
