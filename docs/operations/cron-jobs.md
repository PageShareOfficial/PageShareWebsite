# Cron jobs

## Why they exist

Background work that must happen without a user request: settle expired predictions, retry
on-chain anchoring, close abandoned sessions, refresh metrics views, and keep the Supabase
database from pausing due to inactivity.

## The jobs

All are `GET /api/v1/cron/*` in `backend/app/api/cron.py`.

| Endpoint | What it does | Who calls it |
|---|---|---|
| `/cron/settle-predictions` | Settles due predictions (batch, time-budgeted) | GitHub Actions, every 30 min |
| `/cron/anchor-predictions` | Retries Polygon anchoring; skipped if Polygon not configured | GitHub Actions, every 30 min |
| `/cron/sessions` | Closes sessions inactive for 30+ min | GitHub Actions, every 30 min |
| `/cron/daily` | DB health check, close stale sessions, refresh `daily_metrics` and `engagement_metrics` | Vercel Cron, 05:00 UTC daily |

Schedules live in:
- `.github/workflows/cron-sessions.yml` — `*/30 * * * *`, production environment
  (manual runs can target other environments).
- `frontend/vercel.json` — `0 5 * * *` → `frontend/app/api/cron-daily/route.ts`, which forwards
  to the backend via `frontend/lib/api/cronProxy.ts`.

## Auth

Backend accepts the secret **only in headers**: `X-Cron-Secret: <CRON_SECRET>` or
`Authorization: Bearer <CRON_SECRET>`. Missing/wrong → 403. If `CRON_SECRET` is unset on the
backend, every call is rejected.

## Adding a job

1. Add a `GET` route in `backend/app/api/cron.py` using the existing secret check.
2. Keep it under the serverless time limit — batch and time-budget like
   `settle_due_predictions`.
3. Schedule it: add a step to `.github/workflows/cron-sessions.yml` (frequent jobs) or a Vercel
   cron + proxy route (daily jobs).
4. Document it in the table above.

## Env vars

Backend `CRON_SECRET`; Vercel `CRON_SECRET`, `NEXT_PUBLIC_API_URL`; GitHub environment secrets
`CRON_SECRET`, `CRON_BACKEND_URL`.

## Gotchas

- **Job failures still return HTTP 200** with `{"ok": false, ...}`. The GitHub workflow only checks
  the status code, so a failing job shows green. Check the response body / backend logs.
- No cron runs outside production — in dev, predictions only settle when the owner opens them.
- The anchor job can wait up to 120 s per row for a Polygon receipt.
- `engagement_metrics` is refreshed without `CONCURRENTLY`, so reads block briefly during refresh.
- The daily job depends on the Vercel frontend deployment being live.
