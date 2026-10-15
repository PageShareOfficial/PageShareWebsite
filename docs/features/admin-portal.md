# Admin portal

## Why it exists

PageShare staff need to moderate reported content, watch platform metrics and triage backend
errors without touching the database. Admins also get every paid feature without a
subscription (for testing and support) and a purple tick so users can recognise staff.

## Who is an admin

**Admin = `users.badge = 'admin'`.** Nothing else (no separate role table, no env list).

- Backend check: `is_admin` / `is_admin_user_id` in
  `backend/app/services/admin_access_service.py`.
- Database check: the Supabase SQL function `public.is_admin()` (`SECURITY DEFINER`) reads the
  same column for RLS. **Keep both rules in sync.** The backend can't call `is_admin()` because
  `auth.uid()` is null on backend connections.
- Grant/revoke: run `backend/scripts/grant_admin.sql` in the Supabase SQL editor, once per project
  (dev and prod). The account must have finished onboarding. Replace the placeholder email
  locally — never commit a real one.

## How it works

### Access control

- Every admin API uses `Depends(require_admin)` (`backend/app/middleware/auth.py`) → 403 for
  non-admins. **This is the real security boundary.**
- `/admin` is in `AUTH_PROTECTED_ROUTES` (logged-out → `/`), and the page itself shows
  "Admin access required" unless `backendUser.is_admin` is true. These only avoid a broken UI.
- The sidebar shows the Admin link only for admins. `/admin` is `noindex` and disallowed in
  robots.

### Portal tabs (`components/app/admin/AdminPortal.tsx`)

| Tab | Backend | Actions |
|---|---|---|
| Reports | `GET /api/v1/admin/reports?status=&page=` | mark reviewed / resolved / dismissed; remove content |
| Metrics | `GET /api/v1/metrics/dashboard` | read-only (DAU/MAU, signups, content totals, errors) |
| Errors | `GET /api/v1/errors?resolved=&page=` | mark resolved (`PATCH /errors/{id}/resolve`) |

### Moderation rules (`backend/app/services/admin_report_service.py`)

- Reports cover posts, comments and users; newest first; each item includes a content preview
  (`CONTENT_PREVIEW_MAX_LENGTH`) and reporter/target usernames.
- `PATCH /admin/reports/{id}` sets `reviewed` / `resolved` / `dismissed` and records
  `reviewed_at` + `reviewed_by`. Back to `pending` is not allowed.
- `POST /admin/reports/{id}/remove-content` **soft-deletes** the post/comment (`deleted_at`) and
  resolves **every pending report on the same target**, not just this one.
  User reports can't be removed this way → 422 (no account suspension yet).
- Actions are logged to the `pageshare.admin_moderation` logger.

### Paywall bypass

Admins pass every plan check without a `user_entitlements` row:

| Check | File |
|---|---|
| `is_premium_user` (long posts) | `backend/app/services/subscription_service.py` |
| `is_analyst_user` (submit predictions, own analytics) | `backend/app/services/prediction_service.py` |
| `is_investor_user` (analyst dashboards, saved analysts) | `backend/app/services/saved_analyst_service.py` |
| `resolve_leaderboard_viewer_plan_id` (unmasked leaderboard) | `backend/app/services/prediction_leaderboard_service.py` |

Frontend: `SubscriptionContext` exposes `isAdmin` and forces `isPremium`, `isAnalystPlan` and
`isInvestorPlan` to true for admins.

> New paid gate? Add the admin bypass there too, or admins will hit the paywall.

### Purple tick

`is_admin` is sent on the current user and on author payloads (posts, comments, follows, search,
bookmarks). `AuthorBadges` → `resolveTickVariant` picks the admin tick (`#8B5CF6` in
`frontend/constants/verifiedTick.ts`) **over** the plan tick.

## Files involved

**Backend**
- `app/services/admin_access_service.py` — who is an admin
- `app/middleware/auth.py` — `require_admin`
- `app/api/admin.py`, `app/schemas/admin.py`, `app/services/admin_report_service.py` — moderation
- `app/api/metrics.py`, `app/api/errors.py` — metrics and error logs (admin-only)
- `app/utils/post_author.py` — `is_admin` on authors
- `scripts/grant_admin.sql` — grant/revoke
- Tests: `tests/test_admin_api.py`, `test_admin_access_service.py`, `test_admin_report_service.py`

**Frontend**
- `app/(app)/admin/page.tsx`, `layout.tsx` — page + UI gate + noindex
- `components/app/admin/*` — portal, panels, report card, list/pager/filter chips
- `hooks/admin/*` — paged list, filtered list, row action
- `lib/api/adminApi.ts` — admin API calls
- `contexts/SubscriptionContext.tsx` — `isAdmin` + plan bypass
- `components/app/common/AuthorBadges.tsx`, `constants/verifiedTick.ts` — purple tick

## Gotchas

- Changing an admin's badge takes effect on their next `/users/me` load; the backend checks the
  DB on every request.
- Removing content resolves sibling pending reports silently — check before bulk-removing.
- Soft-deleted content can be restored only by clearing `deleted_at` in the database; there's no
  undo in the UI.
- Reports still never hide content for other users until an admin removes it.
- The paywall bypass is per check; there's no single "admin = all access" switch.
