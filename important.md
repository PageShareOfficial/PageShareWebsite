# News API Integration Guide - Backend Implementation

## Overview
This document outlines how to integrate the news API functionality into your existing Vercel backend, and update your frontend (deployed on Hostinger) to use this backend endpoint.

---

## Architecture

```
Frontend (Hostinger) → Calls → Vercel Backend (/api/news) → External News APIs (GNews/NewsAPI)
```

- **Frontend**: Static Next.js app on Hostinger (no Node.js support)
- **Backend**: Vercel serverless functions (handles news API proxy)
- **News APIs**: GNews API (primary) + NewsAPI (fallback)

---

## Backend Implementation (Vercel)

### 1. Create News API Endpoint

**Location**: `/api/news/route.ts` (or `/api/news/index.ts` depending on your backend structure)

**Endpoint**: `GET /api/news`

### 2. Required Dependencies

You'll need the following utilities from the frontend codebase:

- `utils/api/newsApi.ts` - News fetching logic (fetchFromGNews, fetchFromNewsAPI, fetchNews, fetchNewsByQuery)
- `types/discover.ts` - Type definitions (NewsArticle, NewsCategory)

**Option**: Copy these files to your backend or create them there.

### 3. Environment Variables (Vercel)

Add these in your Vercel project settings (Environment Variables):

```
GNEWS_API_KEY=your_gnews_api_key_here
NEWS_API_KEY=your_newsapi_key_here (optional, fallback)
```

**Important**: 
- Use server-side variables (NO `NEXT_PUBLIC_` prefix)
- These are secure and won't be exposed to the client
- Add to Production, Preview, and Development environments

### 4. API Endpoint Structure

**Expected Query Parameters:**
- `category` (optional): `'all' | 'finance' | 'crypto' | 'politics' | 'business' | 'technology'`
- `page` (optional): Page number (default: 1)
- `q` (optional): Search query string

**Response Format:**
```json
{
  "articles": NewsArticle[],
  "category": NewsCategory (if category-based),
  "page": number,
  "totalResults": number,
  "totalArticles": number
}
```

**Page Size Logic:**
- Page 1: 5 articles (reduced initial load)
- Page 2+: 20 articles per page

### 5. Caching Strategy

**Server-side Cache Headers:**
```
Cache-Control: public, s-maxage=900, stale-while-revalidate=1800
```
- Cache for 15 minutes
- Stale while revalidating for 30 minutes
- Reduces API calls significantly

### 6. CORS Configuration

**If frontend is on different domain** (Hostinger), add CORS headers:

```typescript
headers: {
  'Access-Control-Allow-Origin': 'https://your-hostinger-domain.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

**Allow all origins (if multiple domains):**
```typescript
'Access-Control-Allow-Origin': '*'
```

---

## Frontend Updates (Hostinger Deployment)

### 1. Update API Base URL

**File**: `hooks/discover/useNewsFeed.ts`

**Current**: 
```typescript
const apiUrl = `/api/news?category=${cat}&page=${pageNum}`;
```

**Update to**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.vercel.app';
const apiUrl = `${API_BASE_URL}/api/news?category=${cat}&page=${pageNum}`;
```

**File**: `app/discover/page.tsx` (if there are any direct API calls)

### 2. Environment Variable (Frontend)

**File**: `.env.local` or Hostinger environment settings

```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

**Important**: This is safe to expose (just the backend URL, no API keys)

### 3. Build Configuration

Since Hostinger doesn't support Node.js:

**Option A: Static Export** (Recommended)
- Update `next.config.js`:
  ```javascript
  output: 'export' // This creates a static site
  ```
- Build: `npm run build`
- Deploy the `out` folder to Hostinger

**Option B: Server-Side Rendering** (if Hostinger supports it)
- Keep current build
- But API routes won't work (that's why we're using Vercel backend)

---

## Code to Copy from Frontend to Backend

### 1. Type Definitions

Copy from `types/discover.ts`:
- `NewsArticle` interface
- `NewsCategory` type

### 2. News API Utilities

Copy from `utils/api/newsApi.ts`:
- `fetchFromGNews()` function
- `fetchFromNewsAPI()` function
- `fetchNews()` function (main export)
- `fetchNewsByQuery()` function
- Helper functions: `mapCategoryToNewsAPI()`, `getSearchKeywords()`, `generateArticleId()`, `formatDate()`

**Note**: Make sure to update environment variable access:
- Use `process.env.GNEWS_API_KEY` (not `NEXT_PUBLIC_GNEWS_API_KEY`)
- Use `process.env.NEWS_API_KEY` (not `NEXT_PUBLIC_NEWS_API_KEY`)

### 3. API Route Handler

Use the logic from `app/api/news/route.ts` as reference, but adapt to your backend framework:

**For Next.js API Routes (Vercel):**
```typescript
export async function GET(request: NextRequest) {
  // Implementation from app/api/news/route.ts
}
```

**For Express.js:**
```typescript
app.get('/api/news', async (req, res) => {
  // Similar logic, but use req.query instead of request.nextUrl.searchParams
})
```

---

## Implementation Steps

### Step 1: Backend (Vercel)
1. Create `/api/news` endpoint in your backend
2. Copy news fetching utilities (`utils/api/newsApi.ts`)
3. Copy type definitions (`types/discover.ts`)
4. Implement the route handler (adapt from `app/api/news/route.ts`)
5. Add CORS headers if needed
6. Set environment variables in Vercel dashboard
7. Test the endpoint: `https://your-backend.vercel.app/api/news?category=all&page=1`

### Step 2: Frontend (Local)
1. Create `.env.local` with `NEXT_PUBLIC_API_URL`
2. Update `hooks/discover/useNewsFeed.ts` to use the external API URL
3. Update any other files that call `/api/news`
4. Test locally: verify it calls your Vercel backend

### Step 3: Deployment
1. Deploy backend to Vercel (if not already)
2. Verify backend endpoint works
3. Build frontend: `npm run build`
4. Deploy frontend to Hostinger (upload `out` folder if static export)

---

## Testing Checklist

### Backend (Vercel)
- [ ] Endpoint accessible: `GET /api/news?category=all&page=1`
- [ ] Returns articles array
- [ ] Returns correct totalArticles count
- [ ] Page 1 returns 5 articles
- [ ] Page 2 returns 20 articles
- [ ] CORS headers present (if different domain)
- [ ] Cache headers present
- [ ] Environment variables loaded correctly

### Frontend (Local/Hostinger)
- [ ] API calls go to Vercel backend (check Network tab)
- [ ] Articles display correctly
- [ ] Pagination works (load more)
- [ ] Category switching works
- [ ] Caching works (client-side localStorage)
- [ ] Search functionality works (if implemented)

---

## API Endpoint Examples

### Category-based News
```
GET https://your-backend.vercel.app/api/news?category=finance&page=1
GET https://your-backend.vercel.app/api/news?category=crypto&page=2
GET https://your-backend.vercel.app/api/news?category=all&page=1
```

### Search News
```
GET https://your-backend.vercel.app/api/news?q=bitcoin&page=1
GET https://your-backend.vercel.app/api/news?q=stock%20market&page=1
```

### Response Example
```json
{
  "articles": [
    {
      "id": "news-CNBC-...",
      "title": "Article Title",
      "description": "Article description...",
      "url": "https://...",
      "imageUrl": "https://...",
      "source": "CNBC",
      "publishedAt": "2026-01-09T10:00:00.000Z",
      "category": "finance"
    }
  ],
  "category": "finance",
  "page": 1,
  "totalResults": 5,
  "totalArticles": 25426
}
```

---

## Rate Limits & Optimization

### Free Tier Limits
- **GNews**: 100 requests/day
- **NewsAPI**: 100 requests/day

### Optimization Strategies (Already Implemented)
1. **Server-side caching**: 15-minute cache (reduces API calls)
2. **Client-side caching**: 15-minute localStorage cache
3. **Debounced category switching**: 500ms delay
4. **Reduced initial load**: 5 articles on page 1 (instead of 20)
5. **Request deduplication**: Prevents simultaneous duplicate requests
6. **Smart pagination**: Only loads more when needed

### Monitoring
- Track API usage in Vercel logs
- Monitor daily request count
- Set up alerts if approaching limits

### If Exceeding Limits
- Upgrade to GNews Essential (€39.99/month) - 1,000 requests/day
- Or implement request prioritization (cache popular categories longer)

---

## Error Handling

### Backend Should Handle:
- Missing API keys → Return empty array gracefully
- API errors → Return empty array with proper status code
- Invalid parameters → Return 400 Bad Request
- Rate limit exceeded → Return 429 Too Many Requests

### Frontend Already Handles:
- Empty responses → Shows "No articles found"
- Errors → Displays error message
- Loading states → Shows loading spinner

---

## Security Considerations

### ✅ DO:
- Keep API keys in Vercel environment variables (server-side only)
- Use HTTPS for all API calls
- Validate input parameters
- Set appropriate CORS origins (not `*` in production if possible)

### ❌ DON'T:
- Never use `NEXT_PUBLIC_` prefix for API keys
- Never expose API keys in client-side code
- Never commit API keys to git
- Don't allow all origins in production (unless necessary)

---

## Troubleshooting

### Issue: CORS Error
**Solution**: Add CORS headers to backend response with your Hostinger domain

### Issue: API Keys Not Working
**Solution**: 
- Verify keys are set in Vercel (not in code)
- Check if keys have `NEXT_PUBLIC_` prefix (shouldn't)
- Verify keys are valid and not expired

### Issue: No Articles Returned
**Solution**:
- Check Vercel function logs
- Verify API keys are set
- Check if API quota exceeded
- Verify network connectivity from Vercel

### Issue: Frontend Can't Reach Backend
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check if backend URL is accessible in browser
- Verify CORS headers allow your domain

---

## File Structure Summary

### Backend (Vercel)
```
your-backend/
├── api/
│   └── news/
│       └── route.ts (or index.ts)
├── utils/
│   └── api/
│       └── newsApi.ts
└── types/
    └── discover.ts (or shared types)
```

### Frontend (Hostinger)
```
your-frontend/
├── hooks/
│   └── discover/
│       └── useNewsFeed.ts (updated to use external URL)
├── .env.local (NEXT_PUBLIC_API_URL)
└── (rest of the app remains the same)
```

---

## Quick Reference

### Backend Endpoint
```
GET https://your-backend.vercel.app/api/news
Query Params:
  - category: 'all' | 'finance' | 'crypto' | 'politics' | 'business' | 'technology'
  - page: number (default: 1)
  - q: string (search query)
```

### Environment Variables Needed

**Vercel Backend:**
- `GNEWS_API_KEY` (required)
- `NEWS_API_KEY` (optional, fallback)

**Frontend (Hostinger):**
- `NEXT_PUBLIC_API_URL=https://your-backend.vercel.app`

### Cache Durations
- **Server-side**: 15 minutes (s-maxage=900)
- **Client-side**: 15 minutes (localStorage)
- **Stale-while-revalidate**: 30 minutes

---

## Next Steps

1. **Copy code**: Transfer news API utilities to your backend
2. **Create endpoint**: Implement `/api/news` route in your backend
3. **Set environment variables**: Add API keys in Vercel
4. **Update frontend**: Change API calls to use Vercel backend URL
5. **Test**: Verify everything works end-to-end
6. **Deploy**: Deploy backend (Vercel) and frontend (Hostinger)

---

## Notes

- The free tier (100 requests/day) should be sufficient for initial testing and moderate traffic
- Monitor usage and upgrade if needed
- Client-side caching will significantly reduce API calls for repeat visitors
- Server-side caching handles multiple users requesting the same data simultaneously

---

**Last Updated**: Based on current implementation with client-side caching, debouncing, and optimized pagination.
