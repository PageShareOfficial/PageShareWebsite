# Feed

## Why it exists

The home timeline: every non-deleted post on the platform, minus authors the viewer has muted or
blocked.

## How it works

- **No ranking today.** `GET /api/v1/feed` returns all posts newest first
  (`ORDER BY created_at DESC`). No follow graph, weights or decay.
- Muted/blocked authors are excluded server-side (`content_filters`), and again client-side.
- Offset pagination: `page`, `per_page` (default 20, max 50) → standard `paginated_response`.
- Normal reposts show the original post's stats and like/repost state.
- Frontend loads page 1 only (no infinite scroll) and caches it in memory for 5 minutes
  (`frontend/lib/feedCache.ts`).
- Reports never hide content for others. The reporter's own reported posts are hidden
  client-side only (`hooks/features/useReportedContent.ts`).

## Where to start if adding ranking

- Candidate selection and ordering: `post_service.list_posts` (called by
  `feed_service.get_feed`).
- Switch to cursor pagination at the same time — offset pagination drifts when new posts arrive.

## Files involved

- Backend: `app/api/feed.py`, `app/services/feed_service.py`, `app/services/post_service.py`,
  `app/services/content_filter_service.py`
- Frontend: `hooks/post/usePostsData.ts`, `lib/feedCache.ts`,
  `contexts/ContentFiltersContext.tsx`, `app/(app)/home/page.tsx`

## Gotchas

- `count()` runs on every feed request; tickers and quoted originals are fetched per post (N+1).
- Only the first 20 posts are ever shown on home.
