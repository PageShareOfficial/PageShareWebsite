# Auth, routing & onboarding

## Why it exists

Users sign in with Supabase, get a row in our `users` table, and must pick a real username
before using the app. Logged-out visitors can only see public pages and shared post links.

## How it works

### Sign-in

- Google OAuth and email/password via Supabase (`frontend/contexts/AuthContext.tsx`).
  OAuth and email confirmation both land on `/auth/callback`.
- `/auth/callback` waits for the session (the Supabase client exchanges the code), then
  `resolvePostAuthPath` calls
  `/users/me` and routes to `/onboarding` or `/home`. If `/users/me` fails it shows a retry view
  instead of guessing.
- Email sign-in/up forms call `resolvePostAuthPath` directly.

### The `users` row

- Created lazily by `get_or_create_user_for_auth` (`backend/app/services/user_service.py`) on
  `/session/start`, `/users/me` and a few other `me` endpoints. Safe under concurrent calls.
- New rows get a **placeholder username** `user_<24 hex chars>` (just a unique filler, not a
  signal) and a display name from the OAuth `name` claim (or email).

### "Needs onboarding" rule

**`users.onboarded_at` is the only signal.** NULL = needs onboarding.

- `POST /api/v1/users/me/onboarding` sets username, profile fields, interests, geo country and
  `onboarded_at` (first time only).
- Every `/users/me` response carries `onboarding_completed` (built in `_build_user_response`).
- Frontend `needsOnboarding(user)` in `frontend/utils/auth/postAuthRedirect.ts` reads that flag
  (missing = not onboarded). Applied in the callback/email forms, `/home` (redirects to
  `/onboarding`) and `/onboarding` (redirects to `/home` once done).
- Usernames starting with `user_` are allowed; they no longer affect onboarding.

### Backend token check

`backend/app/services/auth_service.py`: verifies the Supabase JWT locally (HS256 with
`SUPABASE_JWT_SECRET`); if that fails for any reason other than expiry, falls back to asking
Supabase `/auth/v1/user`. Routes use `get_current_user` / `get_optional_user` /
`require_admin` from `backend/app/middleware/auth.py`.

### Route protection (`frontend/proxy.ts` → `lib/supabase/proxy.ts`)

- Logged out + route in `AUTH_PROTECTED_ROUTES` → redirect to `/`.
- Logged out + username route → redirect to `/`, **except** `/:username/posts/:postId`
  (shared post links stay public).
- Logged in + `/` → redirect to `/home`.
- Missing Supabase env vars → no protection at all (dev only).

## Checklist: adding a new top-level route

1. Create the page under `frontend/app/(app)/<route>/` (or `app/<route>/` without the app shell).
2. Add the segment to `RESERVED_ROUTES` in `frontend/utils/core/routeConstants.ts`
   — required; a test scans `app/` and fails otherwise. Also stops it being taken as a username.
3. If sign-in is required: add it to `AUTH_PROTECTED_ROUTES` **and** to the hard-coded list in the
   `config.matcher` regex in `frontend/proxy.ts` (`proxy.test.ts` checks they match).
4. Add a `ROUTES` entry in `frontend/constants/routes.ts`.
5. SEO: add to `ROBOTS_DISALLOWED_PATHS` or `SITEMAP_PATHS` in `frontend/lib/seo/crawlPaths.ts`,
   and set `robots` metadata in the route's `layout.tsx` if it shouldn't be indexed.

## Knobs to tweak

| Constant | File | Value |
|---|---|---|
| `UsernameStr` | `backend/app/schemas/user.py` | `^[a-z0-9_]{3,50}$` |
| Onboarding form rules (username 3–20, age 18+, bio 10–200, ≥1 interest) | `frontend/app/onboarding/page.tsx` | Zod schema |
| `INACTIVITY_MINUTES` | `backend/app/services/session_service.py` | 30 |
| `SESSION_WAIT_MS` | `frontend/app/auth/callback/page.tsx` | 8000 |
| `RESERVED_ROUTES`, `AUTH_PROTECTED_ROUTES` | `frontend/utils/core/routeConstants.ts` | sets |
| `ROBOTS_DISALLOWED_PATHS`, `SITEMAP_PATHS` | `frontend/lib/seo/crawlPaths.ts` | lists |

## Files involved

**Backend**
- `app/services/auth_service.py` — JWT verification
- `app/middleware/auth.py` — auth dependencies
- `app/services/user_service.py` — placeholder row, onboarding, account delete
- `app/api/users.py` — `me`, onboarding, delete account
- `app/services/session_service.py`, `app/api/session.py` — session tracking
- `app/services/supabase_admin.py` — deletes the Supabase auth user

**Frontend**
- `contexts/AuthContext.tsx` — session, sign-in/out, `backendUser`
- `app/auth/callback/page.tsx`, `utils/auth/postAuthRedirect.ts` — post-sign-in routing
- `components/auth/*` — sign-in/up forms
- `app/onboarding/page.tsx` — onboarding form
- `proxy.ts`, `lib/supabase/proxy.ts` — route protection
- `utils/core/routeConstants.ts`, `constants/routes.ts`, `lib/seo/crawlPaths.ts` — route lists

**Env vars:** backend `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`; frontend `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`.

## Gotchas

- Deploy order for anything touching `onboarded_at`: migration + backend first, frontend second.
  A frontend that expects the flag against an old backend sends everyone to onboarding.
- The backend doesn't block reserved names (`home`, `settings`, …) as usernames; only the
  frontend route list knows them.
- Username max length differs: frontend 20, backend 50. Age/bio/interest rules are
  frontend-only.
- **Don't call `exchangeCodeForSession` in `/auth/callback`.** The browser Supabase client
  (`detectSessionInUrl`) already exchanges `?code=` on load and consumes the one-time PKCE
  verifier; a second exchange fails, which used to bounce users via `/?error=auth` → `/home` →
  `/onboarding`. The callback just waits for the session.
- Account deletion: DB row is deleted before the Supabase auth user; if the second step fails,
  the next sign-in creates a fresh placeholder row.
- `last_active_at` tracking only decodes HS256 tokens.
