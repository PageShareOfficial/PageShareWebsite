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

## Regular view (no refresh)

- **`post_stats`** – Standard view; no refresh. Each query runs the underlying `SELECT` and returns current counts.
