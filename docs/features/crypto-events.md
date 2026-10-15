# Crypto events

## Why it exists

The `/events` page lists ongoing and upcoming crypto conferences and meetups, sourced from
Coinpedia. Nothing is stored in our database.

## How it works

- **Scrape:** `backend/app/services/crypto_events_service.py` fetches the first page of
  `https://events.coinpedia.org/` and parses each `div.event_card` with BeautifulSoup
  (name, link, image, location, date + UTC offset, status, ticket type, event type).
  Cards without a name or https URL are skipped; duplicates removed by URL path.
- **Server cache** (in-memory, per process): fresh for `EVENTS_CACHE_TTL`. If a refresh fails or
  parses **zero cards** (likely a markup change), it logs a warning and serves the last good list
  with `is_stale: true`, retrying after `FAILED_REFRESH_RETRY_AFTER`.
- **API:** `GET /api/v1/events` — public, returns `{data, source, fetched_at, is_stale}` with
  `Cache-Control: public, s-maxage=1800, stale-while-revalidate=3600`.
- **Frontend:** `useCryptoEvents` shows any localStorage copy immediately, refetches when it's
  older than `CRYPTO_EVENTS_CACHE_TTL_MS`, and keeps the old copy if the refetch fails. Filters:
  all / ongoing / upcoming / free; ended events are always hidden.

## Knobs to tweak

| Constant | File | Value |
|---|---|---|
| `EVENTS_CACHE_TTL` | `backend/app/services/crypto_events_service.py` | 6 h |
| `FAILED_REFRESH_RETRY_AFTER` | same | 10 min |
| `REQUEST_TIMEOUT_SECONDS` | same | 20 s |
| `CACHE_HEADERS` | `backend/app/api/events.py` | CDN 30 min |
| `CRYPTO_EVENTS_CACHE_TTL_MS` | `frontend/utils/events/cryptoEventsCache.ts` | 1 h |

## Files involved

- Backend: `app/services/crypto_events_service.py`, `app/api/events.py`,
  `app/schemas/crypto_event.py`
- Frontend: `app/(app)/events/`, `components/app/events/`, `hooks/features/useCryptoEvents.ts`,
  `lib/api/cryptoEventsApi.ts`, `utils/events/*`, `types/cryptoEvents.ts`

## Gotchas

- **If the page goes empty, check the scraper first** — it depends on Coinpedia's CSS classes.
  Update the selectors in `crypto_events_service.py`.
- Caches stack (6 h server + 30 min CDN + 1 h browser), so a change on Coinpedia can take hours
  to appear.
- Only Coinpedia's first page is scraped.
- `is_stale` is dropped by the frontend mapper (not shown to users).
- Keep the Coinpedia attribution on the page.
