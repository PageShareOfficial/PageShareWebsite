# PageShare docs

Docs for the parts of the codebase that carry real business rules or are likely to be tuned.
Self-explanatory features (bookmarks, follows, reactions, search, settings UI, etc.) are
intentionally not documented — read the code.

Each page answers: **why it exists → how it works → the knobs to tweak → files involved → gotchas.**

| Page | Read it before you… |
|---|---|
| [Predictions](features/predictions.md) | change submission rules, settlement, ranking, or on-chain anchoring |
| [Billing & plans](features/billing-and-plans.md) | touch Stripe, plan gates, ticks, or content limits |
| [Auth, routing & onboarding](features/auth-and-onboarding.md) | add a top-level route, change sign-in, or onboarding |
| [Feed](features/feed.md) | add ranking or change pagination |
| [Crypto events](features/crypto-events.md) | change the Coinpedia scraper or caching |
| [Cron jobs](operations/cron-jobs.md) | add or reschedule a background job |
| [Admin portal](features/admin-portal.md) | change moderation, admin access, or the paywall bypass |

## Conventions

- Paths are relative to the repo root (`backend/…`, `frontend/…`).
- Env vars are listed by **name only**. Never paste values here.
- Code is the source of truth. If a doc disagrees with the code, fix the doc in the same PR.

## Keeping these useful

- Update the relevant page in the same PR that changes the behaviour it describes.
- New feature with real business rules → add a page in `features/` using the same sections.
- Keep pages short. List files that matter, not every file.
