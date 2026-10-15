# Billing & plans

## Why it exists

Two paid Stripe subscriptions, each monthly or yearly:

- **Analyst** (blue tick) — publish predictions and build a scored public track record.
- **Investor** (green tick) — research analysts: reveal leaderboard identities, open analyst
  dashboards, save analysts.

Both plans also unlock long posts/comments. Stripe is the source of truth; a local
`user_entitlements` row (one per user) mirrors it and is what every gate reads.

## What each plan unlocks (enforced in code)

| Feature | Free | Analyst | Investor |
|---|---|---|---|
| Post / comment / quote length | 280 | 10,000 | 10,000 |
| Submit predictions (5/day) | – | ✓ | – |
| Own analytics dashboard | – | ✓ | – |
| Leaderboard identities | masked | own row | all |
| Analyst dashboards + saved analysts | – | – | ✓ |

Other features listed in `frontend/components/app/plans/planData.ts` are marketing copy with no
gate behind them yet.

## How it works

### Checkout (`usePlanCheckout` → `/api/v1/billing/*`)

1. Same plan + interval as current → open Stripe billing portal.
2. Premium user picking the **other plan type** → blocked (`CROSS_PLAN_SWITCH_MESSAGE`).
   Analyst ↔ Investor can't be switched in place; allowed only after the current plan stops
   granting premium.
3. Premium user, same plan, different interval → `POST /billing/switch` (in-place, prorated
   immediately, no Stripe page).
4. Otherwise → `POST /billing/checkout` → redirect to Stripe Checkout.
   - Reuses an open session for the same plan/interval (double-click protection).
   - Cancels any other live subscriptions on the customer first.
5. Stripe returns to `/home?checkout=success|canceled`; `CheckoutReturnBanner` refreshes status.

### Webhook → entitlement (`POST /billing/webhook`, signature-verified)

- `checkout.session.completed` and `customer.subscription.*` upsert the entitlement row.
- Replays are harmless (full upserts). Events for an untracked subscription in a stale status
  (`STALE_SUBSCRIPTION_STATUSES`) are ignored so an old subscription can't overwrite a new one.
- `GET /billing/status` also **reconciles with Stripe on every call**, repairing missed webhooks.

### Premium rule (`row_grants_premium`)

Premium when status is `active`/`trialing`, or `past_due` within the grace window
(`PAST_DUE_GRACE_DAYS`, clock starts when the backend first records `past_due`).

### Ticks

`get_active_plan_ids_for_users` (batch) → `subscription_plan_id` on every author/user payload →
`mapApiAuthorToUser` → `AuthorBadges` → `VerifiedTickIcon`. Colours in
`frontend/constants/verifiedTick.ts`: analyst `#3b82f6`, investor `#10b981`.
(Gold is reserved for a future advertiser tier.)

## Entitlement gates (where to look when changing access)

**Backend** — all read `user_entitlements`:
- `is_premium_user` (`subscription_service.py`) → content length (`content_limit_service.py`)
- `is_analyst_user` (`prediction_service.py`) → submit + own analytics
- `is_investor_user` / `assert_investor_user` (`saved_analyst_service.py`) → saved analysts,
  investor analytics
- viewer plan in `api/predictions.py` → leaderboard identity reveal

**Frontend** — `useSubscription()` from `contexts/SubscriptionContext.tsx`:
- `isPremium` → composers' max length, RightRail upgrade card, Topbar Manage/Upgrade
- `isAnalystPlan` / `isInvestorPlan` → `usePredictionsView`, `usePredictionAnalytics`,
  `useSavedAnalysts`

## Knobs to tweak

| Constant | File | Value |
|---|---|---|
| `PAST_DUE_GRACE_DAYS` | `backend/app/services/billing_constants.py` | 7 |
| `PREMIUM_STATUSES`, `CANCELABLE_STATUSES`, `STALE_SUBSCRIPTION_STATUSES` | same | see file |
| `FREE_CONTENT_MAX_LENGTH` / `PREMIUM_CONTENT_MAX_LENGTH` | `backend/app/services/content_limit_service.py` **and** `frontend/constants/contentLimits.ts` | 280 / 10000 |
| `CROSS_PLAN_SWITCH_MESSAGE` | `billing_constants.py` **and** `frontend/utils/billing/resolvePlanCardUiState.ts` | copy |
| Display prices | `frontend/components/app/plans/planData.ts` | display only |
| Real prices | Stripe Price IDs (env) | — |

> Values marked **and** are duplicated — change both.

## Files involved

**Backend**
- `app/services/billing_service.py` — Stripe customer, checkout, switch, portal, reconcile, webhook
- `app/services/billing_constants.py` — plan ids, statuses, grace logic, price resolution
- `app/services/subscription_service.py` — entitlement reads/upserts, `row_grants_premium`, batch plan map
- `app/api/billing.py`, `billing_http.py` — routes and error→HTTP mapping
- `app/models/user_entitlement.py` — the table
- `app/utils/post_author.py` — puts `subscription_plan_id` on authors

**Frontend**
- `contexts/SubscriptionContext.tsx` — flags for the whole app
- `hooks/billing/usePlanCheckout.ts` — checkout / switch / portal decision
- `lib/api/billingApi.ts`, `utils/billing/*` — API + portal opener + card states
- `components/app/plans/*`, `components/app/settings/BillingPageContent.tsx` — UI
- `components/app/common/AuthorBadges.tsx`, `constants/verifiedTick.ts` — ticks

**Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_ANALYST_MONTHLY`,
`STRIPE_PRICE_ID_ANALYST_YEARLY`, `STRIPE_PRICE_ID_INVESTOR_MONTHLY`,
`STRIPE_PRICE_ID_INVESTOR_YEARLY`, `STRIPE_CUSTOMER_PORTAL_RETURN_URL`.

## Gotchas

- The prices users pay come from the Stripe Price IDs, not `planData.ts`. Keep them in sync manually.
- Own plan has two sources: `/users/me` (`subscription_plan_id`, fast bootstrap) and
  `/billing/status` (authoritative). The UI trusts the bootstrap until billing loads.
- A failed `/billing/status` fetch silently shows the user as Free.
- Every `/billing/status` call hits Stripe (reconcile + credit balance).
- No invoice webhooks are handled; no event-id deduplication (relies on upserts + reconcile).
- Checkout/switch/portal rate limit is in-memory per process.
- Deleting an account cancels Stripe best-effort; failures don't block deletion.
