# PageShare Backend - Architecture & Module Plan

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Environment:** Development & Production (Supabase Dev/Prod DBs)

---

## Overview

PageShare is a social platform for financial markets discussions. This document outlines the backend architecture, module structure, and implementation plan for the FastAPI backend that will power the frontend deployed on Hostinger (static export) and backend on Vercel serverless functions.

---

## Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │
│   (Hostinger -      │
│    Static Export)   │
└──────────┬──────────┘
           │
           │ HTTP/HTTPS
           │ Authorization: Bearer <JWT>
           │
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
│   (Vercel Serverless│
│    Functions)       │
└──────────┬──────────┘
           │
           │ SQL Queries
           │ Supabase Client
           │
           ▼
┌─────────────────────┐
│  Supabase PostgreSQL│
│  - Dev Database     │
│  - Prod Database    │
└─────────────────────┘

┌─────────────────────┐
│  Supabase Storage   │
│  - Profile Pictures │
│  - Post Media       │
└─────────────────────┘

┌─────────────────────┐
│  Supabase Realtime  │
│  (WebSocket Direct  │
│   to Frontend)      │
└─────────────────────┘
```

---

## Tech Stack

### Backend Runtime
- **FastAPI** (Python 3.11+) - Web framework
- **Vercel Serverless Functions** - Deployment platform
- **Supabase Python Client** - Database & storage access

### Database & Services
- **Supabase PostgreSQL** (Dev & Prod databases)
- **Supabase Storage** - File storage (profile pictures, post media)
- **Supabase Auth** - Authentication (Google OAuth)
- **Supabase Realtime** - Real-time subscriptions

### Monitoring & Error Tracking
- **Sentry** - Error tracking for frontend & backend (free tier: 5K events/month)
- **Vercel Analytics** - Frontend performance monitoring
- **Supabase Logs** - Database query logs

### IP Geolocation Services
- **ipapi.co** - IP geolocation (free tier: 1,000 requests/day)
- **ip-api.com** - Alternative free IP geolocation (45 requests/min)
- **MaxMind GeoIP2** - Premium option (paid)

### Key Dependencies
```
fastapi>=0.104.0
uvicorn>=0.24.0
sqlalchemy>=2.0.0
alembic>=1.12.0
pydantic>=2.5.0
supabase>=2.0.0
python-multipart>=0.0.6
pillow>=10.0.0
pyjwt>=2.8.0
python-dotenv>=1.0.0
sentry-sdk>=1.38.0  # Error tracking
httpx>=0.25.0  # For IP geolocation API calls
```

---

## Module Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app & route registration
│   ├── config.py                  # Configuration (env vars, DB URLs)
│   ├── database.py                # SQLAlchemy setup & session management
│   │
│   ├── models/                    # SQLAlchemy ORM Models
│   │   ├── __init__.py
│   │   ├── user.py                # User model
│   │   ├── post.py                # Post/Tweet model
│   │   ├── comment.py             # Comment model
│   │   ├── ticker.py              # Ticker model
│   │   ├── post_ticker.py         # Post-Ticker junction
│   │   ├── reaction.py            # Like/Reaction model
│   │   ├── repost.py              # Repost model (normal & quote)
│   │   ├── follow.py              # Follow relationship
│   │   ├── bookmark.py            # Bookmark model
│   │   ├── poll.py                # Poll model
│   │   ├── poll_vote.py           # Poll vote model
│   │   ├── content_filter.py      # Muted/Blocked users
│   │   └── report.py              # Content reports
│   │
│   ├── schemas/                   # Pydantic Request/Response Schemas
│   │   ├── __init__.py
│   │   ├── user.py                # User schemas
│   │   ├── post.py                # Post schemas
│   │   ├── comment.py             # Comment schemas
│   │   ├── ticker.py              # Ticker schemas
│   │   ├── reaction.py            # Reaction schemas
│   │   ├── follow.py              # Follow schemas
│   │   ├── bookmark.py            # Bookmark schemas
│   │   ├── poll.py                # Poll schemas
│   │   ├── search.py              # Search schemas
│   │   ├── feed.py                # Feed schemas
│   │   └── common.py              # Common schemas (pagination, errors)
│   │
│   ├── api/                       # API Route Handlers
│   │   ├── __init__.py
│   │   ├── auth.py                # Authentication endpoints
│   │   ├── users.py               # User endpoints
│   │   ├── posts.py               # Post endpoints
│   │   ├── comments.py            # Comment endpoints
│   │   ├── reactions.py           # Reaction (like) endpoints
│   │   ├── reposts.py             # Repost endpoints
│   │   ├── tickers.py             # Ticker endpoints
│   │   ├── follows.py             # Follow endpoints
│   │   ├── bookmarks.py           # Bookmark endpoints
│   │   ├── polls.py               # Poll endpoints
│   │   ├── search.py              # Search endpoints
│   │   ├── feed.py                # Feed endpoints
│   │   ├── content_filters.py     # Mute/Block endpoints
│   │   ├── reports.py             # Report endpoints
│   │   ├── media.py               # Media upload endpoints
│   │   ├── geolocation.py         # IP/timezone detection endpoints
│   │   └── metrics.py             # Admin metrics endpoints
│   │
│   ├── services/                  # Business Logic Services
│   │   ├── __init__.py
│   │   ├── auth_service.py        # JWT verification, user extraction
│   │   ├── user_service.py        # User CRUD operations
│   │   ├── post_service.py        # Post CRUD, feed generation
│   │   ├── comment_service.py     # Comment operations
│   │   ├── ticker_service.py      # Ticker extraction & management
│   │   ├── feed_service.py        # Feed optimization & querying
│   │   ├── storage_service.py     # Supabase Storage operations
│   │   ├── notification_service.py # Notification logic (future)
│   │   ├── metrics_service.py     # Metrics calculation
│   │   ├── geolocation_service.py # IP geolocation & timezone detection
│   │   └── error_service.py       # Error logging & tracking
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── __init__.py
│   │   ├── ticker_extractor.py    # Extract $TICKER from text
│   │   ├── media_validator.py     # Image validation
│   │   ├── pagination.py          # Pagination helpers
│   │   ├── datetime_utils.py      # Date/time utilities
│   │   └── cache.py               # Caching utilities (future)
│   │
│   └── middleware/                # Custom Middleware
│       ├── __init__.py
│       ├── auth.py                # JWT auth dependency
│       ├── cors.py                # CORS configuration
│       └── error_handler.py       # Global error handling
│
├── alembic/                       # Database Migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── tests/                         # Pytest Test Suite
│   ├── __init__.py
│   ├── conftest.py                # Test fixtures
│   ├── test_auth.py
│   ├── test_users.py
│   ├── test_posts.py
│   ├── test_comments.py
│   ├── test_feed.py
│   ├── test_tickers.py
│   └── test_services.py
│
├── vercel.json                    # Vercel deployment config
├── requirements.txt               # Python dependencies
├── alembic.ini                    # Alembic config
├── .env.example                   # Environment variables template
└── README.md                      # Backend README
```

---

## Environment Configuration

### Development Environment
```env
# Database (Supabase Dev)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]
SUPABASE_JWT_SECRET=[dev-jwt-secret]

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Storage
SUPABASE_STORAGE_BUCKET=profile-pictures-dev

# App
ENVIRONMENT=development
API_PREFIX=/api/v1
```

### Production Environment
```env
# Database (Supabase Prod)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]
SUPABASE_JWT_SECRET=[prod-jwt-secret]

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Storage
SUPABASE_STORAGE_BUCKET=profile-pictures

# Error Tracking (Sentry)
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_ENVIRONMENT=production

# IP Geolocation
IPAPI_API_KEY=[optional-api-key] # For ipapi.co (free tier: no key needed)
# OR
IP_API_KEY=[optional-api-key] # For ip-api.com (free tier: no key needed)

# App
ENVIRONMENT=production
API_PREFIX=/api/v1
```

---

## Core Modules & Responsibilities

### 1. Authentication Module (`app/api/auth.py`)
- **JWT Verification** - Verify Supabase JWT tokens
- **User Session Management** - Extract user from token
- **Dependencies** - `get_current_user`, `get_optional_user`

### 2. User Module (`app/api/users.py`)
- **Profile Management** - CRUD operations for user profiles
- **Onboarding** - Update user interests, bio, profile settings
- **Profile Pictures** - Upload/delete profile pictures
- **User Search** - Search users by username/display name

### 3. Post Module (`app/api/posts.py`)
- **Post CRUD** - Create, read, update, delete posts
- **Post Feed** - Get paginated posts (home feed, user posts)
- **Post Details** - Get single post with comments/reactions
- **Ticker Extraction** - Auto-extract tickers from post content

### 4. Comment Module (`app/api/comments.py`)
- **Comment CRUD** - Create, read, update, delete comments
- **Nested Comments** - Support for replies (future)
- **Comment Feed** - Get comments for a post

### 5. Reaction Module (`app/api/reactions.py`)
- **Like/Unlike** - Toggle reactions on posts/comments
- **Reaction Counts** - Get reaction statistics

### 6. Repost Module (`app/api/reposts.py`)
- **Normal Repost** - Simple repost (no quote)
- **Quote Repost** - Repost with additional content
- **Undo Repost** - Remove repost

### 7. Ticker Module (`app/api/tickers.py`)
- **Ticker Details** - Get ticker info, charts, metrics
- **Ticker Posts** - Get all posts mentioning a ticker
- **Trending Tickers** - Get trending tickers by mentions

### 8. Follow Module (`app/api/follows.py`)
- **Follow/Unfollow** - Toggle follow relationships
- **Followers/Following** - Get user's followers/following lists
- **Follow Suggestions** - Suggested users to follow

### 9. Bookmark Module (`app/api/bookmarks.py`)
- **Bookmark/Unbookmark** - Toggle bookmarks
- **Bookmarked Posts** - Get user's bookmarked posts

### 10. Poll Module (`app/api/polls.py`)
- **Poll Creation** - Create polls with options
- **Poll Voting** - Vote on poll options
- **Poll Results** - Get poll results and statistics

### 11. Search Module (`app/api/search.py`)
- **Unified Search** - Search users, posts, tickers
- **Advanced Filters** - Filter by type, date range, etc.

### 12. Feed Module (`app/api/feed.py`)
- **Home Feed** - Optimized feed from followed users
- **For You Feed** - Algorithmic feed (future)
- **Feed Optimization** - Single query with JOINs

### 13. Content Filters Module (`app/api/content_filters.py`)
- **Mute Users** - Mute user's posts
- **Block Users** - Block users completely
- **Filter Lists** - Get muted/blocked users

### 14. Reports Module (`app/api/reports.py`)
- **Report Content** - Report posts, comments, users
- **Report Types** - Spam, harassment, inappropriate content

### 15. Media Module (`app/api/media.py`)
- **Image Upload** - Upload images for posts/comments
- **Image Validation** - Validate format, size, dimensions
- **GIF Support** - Handle GIF URLs from Giphy

---

## Service Layer Responsibilities

### Auth Service (`app/services/auth_service.py`)
- Verify JWT tokens from Supabase
- Extract user ID from token claims
- Validate token expiration
- Handle refresh tokens (future)

### User Service (`app/services/user_service.py`)
- Create/update user profiles
- Handle profile picture uploads
- User search and filtering
- Onboarding flow management

### Post Service (`app/services/post_service.py`)
- Create posts with ticker extraction
- Generate optimized feeds
- Handle reposts (normal & quote)
- Post deletion and soft-delete

### Ticker Service (`app/services/ticker_service.py`)
- Extract ticker symbols from text (`$TICKER`, `#TICKER`)
- Create/update ticker records
- Link tickers to posts
- Calculate trending tickers

### Feed Service (`app/services/feed_service.py`)
- Generate optimized feed queries
- Apply user filters (muted/blocked)
- Pagination with cursor-based approach
- Feed caching (future)

### Storage Service (`app/services/storage_service.py`)
- Upload files to Supabase Storage
- Delete files from storage
- Generate public URLs
- Validate file types and sizes

---

## Database Strategy (Dev vs Prod)

### Development Database
- **Purpose:** Local development, testing, feature development
- **Connection:** Supabase Dev project
- **Migrations:** Run Alembic migrations during development
- **Data:** Can be reset/cleared frequently
- **Environment Variable:** `DATABASE_URL` (dev)

### Production Database
- **Purpose:** Live production data, real users
- **Connection:** Supabase Prod project
- **Migrations:** Run Alembic migrations before deployment
- **Data:** Permanent, backed up regularly
- **Environment Variable:** `DATABASE_URL` (prod, in Vercel)

### Migration Strategy
1. **Develop Locally:** Test migrations on dev database
2. **Review Migration:** Check migration SQL
3. **Deploy to Prod:** Run migration on prod database
4. **Rollback Plan:** Keep rollback migrations ready

---

## API Versioning

- **Current Version:** `/api/v1`
- **Future Versions:** `/api/v2`, `/api/v3` (backward compatible)
- **Versioning Strategy:** URL-based versioning

---

## Error Handling Strategy

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Error Codes
- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid or expired token
- `PERMISSION_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Security Considerations

1. **JWT Verification** - All protected routes verify JWT
2. **CORS** - Configured for specific origins
3. **Rate Limiting** - Per-user rate limiting (future)
4. **Input Validation** - All inputs validated with Pydantic
5. **SQL Injection** - Prevented via SQLAlchemy ORM
6. **XSS Protection** - Sanitize user inputs
7. **File Upload Security** - Validate file types, scan for malware (future)

---

## Deployment (Vercel Serverless)

### Vercel Configuration (`vercel.json`)
```json
{
  "functions": {
    "app/main.py": {
      "runtime": "python3.11"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/app/main.py"
    }
  ]
}
```

### Serverless Function Structure
- Each API route maps to a FastAPI endpoint
- Cold starts minimized with connection pooling
- Environment variables set in Vercel dashboard

---

## Testing Strategy

1. **Unit Tests** - Test services and utilities
2. **Integration Tests** - Test API endpoints
3. **Database Tests** - Use test database
4. **Test Coverage** - Aim for 80%+ coverage

---

## Performance Optimizations

1. **Database Indexing** - Indexes on frequently queried columns
2. **Query Optimization** - Single queries with JOINs
3. **Connection Pooling** - Reuse database connections
4. **Caching** - Cache frequently accessed data (future)
5. **Pagination** - Cursor-based pagination for large datasets

---

## Error Tracking & Monitoring

### Backend Error Tracking (Sentry)

**Integration:**
- Sentry SDK for Python/FastAPI
- Automatic exception capture
- Custom error context (user ID, request ID, etc.)
- Performance monitoring (response times, query times)

**Setup:**
```python
# app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "production"),
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% of requests
    profiles_sample_rate=0.1,
)
```

**Error Context:**
- User ID (from JWT)
- Request ID (for tracing)
- Request path, method, params
- Database query info
- Stack traces

### Frontend Error Tracking (Sentry)

**Integration:**
- Sentry SDK for Next.js/React
- Client-side error boundary
- Unhandled promise rejections
- API error tracking

**Setup:**
```javascript
// frontend/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Add user context
    if (event.user) {
      event.user.id = getCurrentUserId();
    }
    return event;
  },
});
```

**Error Context:**
- User ID, username
- Browser/device info
- Page URL, route
- Component stack traces
- API request failures

### Logging Strategy

**Backend Logs:**
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Request/response logging (sanitized)
- Database query logging (slow queries only)

**Frontend Logs:**
- Console errors → Sentry
- API errors → Sentry with context
- User actions (analytics, not errors)

### Monitoring Dashboards

**Sentry Dashboard:**
- Error frequency & trends
- Affected users
- Error grouping & deduplication
- Performance metrics
- Release tracking

**Vercel Analytics:**
- Frontend performance
- Page load times
- API response times
- User analytics

**Supabase Dashboard:**
- Database performance
- Query logs
- Storage usage
- API usage

---

## IP Geolocation & Timezone Detection

### Service: Geolocation Service (`app/services/geolocation_service.py`)

**Purpose:**
- Detect user IP address
- Get geolocation (country, city, region)
- Determine timezone from IP or browser
- Store in user profile during onboarding

**Implementation:**
1. **IP Detection:** Extract IP from request headers (X-Forwarded-For, X-Real-IP)
2. **Geolocation API:** Call ipapi.co or ip-api.com to get location
3. **Timezone Resolution:**
   - Prefer browser-detected timezone (from frontend)
   - Fallback to timezone from IP geolocation
   - Store both IP country and browser timezone

**API Flow:**
```
Frontend → POST /api/onboarding
  ├─ Browser detects timezone → Intl.DateTimeFormat().resolvedOptions().timeZone
  ├─ Sends timezone in request
  │
Backend → Extracts IP from request
  ├─ Calls geolocation API → Gets country/city
  ├─ Validates/uses browser timezone
  ├─ Stores: country, timezone, ip_address (hashed)
```

**Privacy Considerations:**
- Hash IP addresses before storage
- Only store country-level location
- Allow users to manually set timezone
- GDPR compliant (user consent)

---

## Admin Metrics & Analytics

### Metrics Service (`app/services/metrics_service.py`)

**Purpose:**
- Calculate key metrics for investors/admins
- Real-time dashboard data
- Historical trends
- Export capabilities

**Key Metrics:**

1. **User Metrics:**
   - DAU (Daily Active Users)
   - MAU (Monthly Active Users)
   - New signups (daily, weekly, monthly)
   - User retention (Day 1, Day 7, Day 30)
   - Churn rate
   - Geographic distribution

2. **Engagement Metrics:**
   - Posts per user (average)
   - Comments per post (average)
   - Reactions per post (average)
   - Reposts per post (average)
   - Active users (posted/commented/reacted)
   - Session duration (from frontend analytics)

3. **Content Metrics:**
   - Total posts (daily, weekly, monthly)
   - Posts with media (percentage)
   - Posts with polls (percentage)
   - Most mentioned tickers
   - Trending tickers

4. **Growth Metrics:**
   - User growth rate (WoW, MoM)
   - Content creation growth
   - Engagement growth
   - Viral coefficient

5. **Platform Health:**
   - API response times
   - Error rates
   - Database performance
   - Storage usage

**Implementation:**
- Materialized views for fast queries
- Scheduled jobs for pre-calculated metrics
- Real-time calculations for current metrics
- Caching for frequently accessed metrics

### Metrics Endpoints

- `GET /api/metrics/dashboard` - All key metrics (admin only)
- `GET /api/metrics/users` - User metrics
- `GET /api/metrics/engagement` - Engagement metrics
- `GET /api/metrics/growth` - Growth metrics
- `GET /api/metrics/health` - Platform health metrics
- `GET /api/metrics/export` - Export metrics as CSV/JSON

---

## Monitoring & Logging

1. **Error Tracking** - Sentry for frontend & backend
2. **Performance Monitoring** - Track API response times, database queries
3. **Database Monitoring** - Monitor query performance, slow queries
4. **User Activity Tracking** - Track key user actions (for metrics)
5. **Log Aggregation** - Centralized logging for debugging
6. **Alerting** - Set up alerts for critical errors, high error rates

---

## Next Steps

1. Set up backend project structure
2. Configure Supabase Dev & Prod projects
3. Set up environment variables
4. Create database models
5. Implement authentication
6. Build core API endpoints
7. Test thoroughly
8. Deploy to Vercel

---

**Document Status:** ✅ Complete  
**Ready for Implementation:** Yes
