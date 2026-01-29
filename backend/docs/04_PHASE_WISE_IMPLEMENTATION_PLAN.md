# PageShare Backend - Phase-Wise Implementation Plan

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Purpose:** Jira ticket creation, sprint planning, and professional development workflow

---

## Overview

This document breaks down the PageShare backend implementation into manageable phases with specific, actionable tasks. Each phase can be mapped to Jira Epics, with tasks as Stories/Subtasks for sprint planning.

**Estimated Total Timeline:** 8-12 weeks (depending on team size and sprint velocity)

---

## Phase 0: Project Setup & Foundation (Week 1)

**Goal:** Set up development environment, repository structure, and basic tooling.

### Epic: Project Infrastructure

#### Tasks:
1. **Setup Git Repository Structure**
   - [x] Create `backend/` directory structure
   - [x] Initialize Git repository (if separate repo) or ensure proper branch structure
   - [x] Setup `.gitignore` for Python/FastAPI
   - [x] Create `README.md` with setup instructions

2. **Python Environment Setup**
   - [x] Setup Python 3.11+ virtual environment
   - [x] Create `requirements.txt` with all dependencies
   - [x] Setup `pyproject.toml` or `setup.py` (optional)
   - [x] Document virtual environment activation commands

3. **Development Tooling**
   - [x] Configure code formatter (Black)
   - [x] Setup linter (Ruff or Flake8)
   - [x] Configure type checking (mypy)
   - [x] Setup pre-commit hooks
   - [x] Create `.editorconfig` file

4. **IDE Configuration**
   - [x] Setup VS Code settings (`.vscode/settings.json`)
   - [x] Configure Python interpreter path
   - [x] Setup debugging configuration
   - [x] Install recommended extensions

5. **Documentation Setup**
   - [x] Verify all 3 planning documents are in place
   - [x] Create developer onboarding guide
   - [x] Setup API documentation framework (FastAPI auto-docs)

**Acceptance Criteria:**
- ✅ Virtual environment can be created and activated
- ✅ Dependencies install without errors
- ✅ Linting and formatting tools work
- ✅ All planning documents reviewed

**Estimated Effort:** 2-3 days

---

## Phase 1: Database & Configuration Setup (Week 1-2)

**Goal:** Configure Supabase databases, create schema, and setup environment management.

### Epic: Database Configuration

#### Tasks:
1. **Supabase Project Setup**
   - [x] Create Supabase Dev project
   - [x] Create Supabase Prod project
   - [x] Get connection strings for both databases
   - [x] Document Supabase project URLs and keys

2. **Environment Variables Setup**
   - [x] Create `.env.example` file with all required variables
   - [x] Create `.env.local` for local development
   - [x] Setup environment variable validation in `config.py`
   - [x] Document all environment variables

3. **Database Connection Configuration**
   - [x] Create `app/config.py` with environment-based configuration
   - [x] Implement database URL parsing and connection logic
   - [x] Add configuration for Dev vs Prod database switching
   - [x] Test connection to both databases

4. **SQLAlchemy Setup**
   - [x] Create `app/database.py` with SQLAlchemy engine and session
   - [x] Setup connection pooling
   - [x] Configure session management (dependency injection)
   - [x] Add database health check endpoint

5. **Alembic Migration Setup**
   - [x] Initialize Alembic (`alembic init`)
   - [x] Configure `alembic.ini` for Supabase PostgreSQL
   - [x] Setup `alembic/env.py` with database URL from config
   - [x] Create first empty migration to verify setup

**Acceptance Criteria:**
- ✅ Can connect to both Dev and Prod databases
- ✅ Environment variables are validated on startup
- ✅ Alembic can create migrations
- ✅ Database health check endpoint returns status

**Estimated Effort:** 3-4 days

---

## Phase 2: Database Schema & Models (Week 2-3)

**Goal:** Create all database tables and SQLAlchemy models.

### Epic: Database Schema Implementation

#### Tasks:
1. **Create Core Models**
   - [x] Create `app/models/__init__.py`
   - [x] Implement `User` model (users table)
   - [x] Implement `Post` model (posts table)
   - [x] Implement `Comment` model (comments table)
   - [x] Implement `Ticker` model (tickers table)
   - [x] Implement `PostTicker` model (post_tickers junction)

2. **Create Relationship Models**
   - [x] Implement `Reaction` model (reactions table)
   - [x] Implement `Repost` model (reposts table)
   - [x] Implement `Follow` model (follows table)
   - [x] Implement `Bookmark` model (bookmarks table)

3. **Create Feature Models**
   - [x] Implement `Poll` model (polls table)
   - [x] Implement `PollVote` model (poll_votes table)
   - [x] Implement `ContentFilter` model (content_filters table)
   - [x] Implement `Report` model (reports table)
   - [x] Implement `UserInterest` model (user_interests table)
   - [x] Implement `WatchlistItem` model (watchlist_items table)

4. **Create Tracking Models**
   - [x] Implement `ErrorLog` model (error_logs table)
   - [x] Implement `UserSession` model (user_sessions table)

5. **Create Database Migrations**
   - [x] Generate migration for all tables
   - [x] Review generated migration SQL
   - [x] Test migration on Dev database
   - [x] Create rollback migration
   - [x] Document migration commands

6. **Create Database Functions & Triggers**
   - [x] Create `update_updated_at()` function
   - [x] Create triggers for `updated_at` on posts, comments, users
   - [x] Test trigger functionality

7. **Create Views & Materialized Views**
   - [x] Create `post_stats` view
   - [x] Create `trending_tickers` materialized view
   - [x] Create `daily_metrics` materialized view
   - [x] Create `engagement_metrics` materialized view
   - [x] Document view refresh commands

**Acceptance Criteria:**
- ✅ All 17 models created and tested
- ✅ All migrations run successfully on Dev database
- ✅ All relationships and constraints work correctly
- ✅ Views and materialized views are created
- ✅ Model tests pass

**Estimated Effort:** 5-7 days

---

## Phase 3: Authentication & Middleware (Week 3-4)

**Goal:** Implement JWT authentication, middleware, and security.

### Epic: Authentication System

#### Tasks:
1. **JWT Verification Service**
   - [x] Create `app/services/auth_service.py`
   - [x] Implement JWT token verification using Supabase JWT secret
   - [x] Implement token expiration checking
   - [x] Extract user ID from token claims (`sub` field)
   - [x] Handle invalid/expired tokens

2. **Auth Middleware/Dependencies**
   - [x] Create `app/middleware/auth.py`
   - [x] Implement `get_current_user` dependency (required auth)
   - [x] Implement `get_optional_user` dependency (optional auth)
   - [x] Add error handling for auth failures
   - [x] Test middleware with valid/invalid tokens

3. **CORS Configuration**
   - [x] Create `app/middleware/cors.py`
   - [x] Configure CORS for frontend origins
   - [x] Setup environment-based CORS origins
   - [x] Test CORS headers in responses

4. **Error Handling Middleware**
   - [x] Create `app/middleware/error_handler.py`
   - [x] Implement global exception handler
   - [x] Format error responses consistently
   - [x] Log errors to Sentry (if configured)
   - [x] Test error handling with various exceptions

5. **Auth Endpoints**
   - [x] Create `app/api/auth.py`
   - [x] Implement `POST /auth/verify` endpoint
   - [x] Test auth endpoints
   - [x] Document auth flow

6. **Request Logging Middleware** (Optional)
   - [x] Implement request/response logging
   - [x] Add request ID generation
   - [x] Log slow requests (>500ms)

**Acceptance Criteria:**
- ✅ JWT tokens are verified correctly
- ✅ Protected endpoints require valid tokens
- ✅ CORS is configured for frontend
- ✅ Errors are handled consistently
- ✅ Auth endpoints work end-to-end

**Estimated Effort:** 4-5 days

---

## Phase 4: User Management (Week 4-5)

**Goal:** Implement user profile management, onboarding, and profile pictures.

### Epic: User Management System

#### Tasks:
1. **User Service**
   - [x] Create `app/services/user_service.py`
   - [x] Implement user CRUD operations
   - [x] Implement username validation and uniqueness check
   - [x] Implement user search functionality
   - [x] Add user stats calculation

2. **User Schemas**
   - [x] Create `app/schemas/user.py`
   - [x] Create request schemas (CreateUser, UpdateUser)
   - [x] Create response schemas (UserResponse, UserProfile)
   - [x] Add validation rules

3. **User API Endpoints**
   - [x] Create `app/api/users.py`
   - [x] Implement `GET /users/me` - Get current user
   - [x] Implement `GET /users/{user_id}` - Get user by ID
   - [x] Implement `PATCH /users/me` - Update user profile
   - [x] Add input validation
   - [x] Test all endpoints

4. **Geolocation Service**
   - [x] Create `app/services/geolocation_service.py`
   - [x] Implement IP address extraction from request headers
   - [x] Integrate with ip-api.com
   - [x] Implement IP hashing (SHA-256)
   - [x] Handle geolocation API failures gracefully

5. **Onboarding Endpoint**
   - [x] Create `POST /users/me/onboarding` endpoint
   - [x] Accept timezone from frontend (browser-detected)
   - [x] Extract IP and get country via geolocation service
   - [x] Store user data with country, timezone, hashed IP
   - [x] Handle username conflicts
   - [x] Test onboarding flow

6. **Storage Service**
   - [x] Create `app/services/storage_service.py`
   - [x] Implement Supabase Storage client setup
   - [x] Implement file upload to `profile-pictures` bucket
   - [x] Implement file deletion from storage
   - [x] Generate public URLs for uploaded files
   - [x] Handle upload errors

7. **Profile Picture Endpoints**
   - [x] Create `POST /users/me/profile-picture` endpoint
   - [x] Implement image validation (size, format, dimensions)
   - [x] Upload image to Supabase Storage
   - [x] Update user profile_picture_url
   - [x] Delete old profile picture if exists
   - [x] Create `DELETE /users/me/profile-picture` endpoint

8. **Media Validation Utilities**
   - [x] Create `app/utils/media_validator.py`
   - [x] Validate file types (JPEG, PNG, WebP)
   - [x] Validate file sizes (max 5MB)
   - [x] Validate image dimensions (optional)
   - [x] Test validation logic

**Acceptance Criteria:**
- ✅ Users can create and update profiles
- ✅ Onboarding works with IP/timezone detection
- ✅ Profile pictures can be uploaded and deleted
- ✅ Images are validated before upload
- ✅ All user endpoints work correctly

**Estimated Effort:** 6-8 days

---

## Phase 5: Core Content Features (Week 5-7)

**Goal:** Implement posts, comments, reactions, and reposts.

### Epic: Content Creation & Interaction

#### Tasks:
1. **Ticker Extraction Service**
   - [x] Create `app/utils/ticker_extractor.py`
   - [x] Implement regex pattern matching (`$TICKER`, `#TICKER`)
   - [x] Extract ticker symbols from text
   - [x] Normalize ticker symbols (uppercase)
   - [x] Test ticker extraction

2. **Ticker Service**
   - [x] Create `app/services/ticker_service.py`
   - [x] Implement ticker creation/lookup
   - [x] Link tickers to posts
   - [x] Calculate trending tickers (from materialized view)
   - [x] Test ticker operations

3. **Post Service**
   - [x] Create `app/services/post_service.py`
   - [x] Implement post creation with ticker extraction
   - [x] Implement post retrieval (single, list)
   - [x] Implement post deletion (soft delete)
   - [x] Implement post stats calculation
   - [x] Handle repost logic (in repost_service)

4. **Post Schemas**
   - [x] Create `app/schemas/post.py`
   - [x] Create CreatePost, PostResponse schemas
   - [x] Include author, stats, interactions in response
   - [x] Add validation rules

5. **Post API Endpoints**
   - [x] Create `app/api/posts.py`
   - [x] Implement `POST /posts` - Create post
   - [x] Implement `GET /posts` - List posts (paginated)
   - [x] Implement `GET /posts/{post_id}` - Get single post
   - [x] Implement `DELETE /posts/{post_id}` - Delete post
   - [x] Test all endpoints

6. **Comment Service**
   - [x] Create `app/services/comment_service.py`
   - [x] Implement comment CRUD operations
   - [x] Calculate comment stats
   - [x] Test comment operations

7. **Comment Schemas**
   - [x] Create `app/schemas/comment.py`
   - [x] Create request/response schemas
   - [x] Add validation

8. **Comment API Endpoints**
   - [x] Create `app/api/comments.py`
   - [x] Implement `POST /posts/{post_id}/comments` - Create comment
   - [x] Implement `GET /posts/{post_id}/comments` - List comments
   - [x] Implement `DELETE /comments/{comment_id}` - Delete comment
   - [x] Test all endpoints

9. **Reaction Service**
   - [x] Create `app/services/reaction_service.py`
   - [x] Implement reaction toggle (like/unlike)
   - [x] Calculate reaction counts
   - [x] Check if user has reacted
   - [x] Test reaction operations

10. **Reaction API Endpoints**
    - [x] Create `app/api/reactions.py`
    - [x] Implement `POST /posts/{post_id}/reactions` - Toggle reaction
    - [x] Implement `POST /comments/{comment_id}/reactions` - Toggle reaction
    - [x] Test endpoints

11. **Repost Service**
    - [x] Create `app/services/repost_service.py`
    - [x] Implement normal repost creation
    - [x] Implement quote repost creation (creates new post)
    - [x] Implement repost deletion
    - [x] Calculate repost counts (in post_service)
    - [x] Test repost operations

12. **Repost API Endpoints**
    - [x] Create `app/api/reposts.py`
    - [x] Implement `POST /posts/{post_id}/reposts` - Create repost
    - [x] Implement `DELETE /posts/{post_id}/reposts` - Remove repost
    - [x] Test endpoints

**Acceptance Criteria:**
- ✅ Posts can be created with ticker extraction
- ✅ Comments can be added to posts
- ✅ Reactions (likes) work on posts and comments
- ✅ Reposts (normal and quote) work correctly
- ✅ All endpoints are tested and working

**Estimated Effort:** 8-10 days

---

## Phase 6: Social Features (Week 7-8)

**Goal:** Implement follows, bookmarks, and content filters.

### Epic: Social Interactions

#### Tasks:
1. **Follow Service**
   - [x] Create `app/services/follow_service.py`
   - [x] Implement follow/unfollow functionality
   - [x] Check follow relationships (is_following)
   - [x] Calculate follower/following counts (via user_service.get_user_stats)
   - [x] Prevent self-follow
   - [x] Test follow operations

2. **Follow Schemas**
   - [x] Create `app/schemas/follow.py`
   - [x] Create request/response schemas

3. **Follow API Endpoints**
   - [x] Create `app/api/follows.py`
   - [x] Implement `POST /users/{user_id}/follow` - Follow user
   - [x] Implement `DELETE /users/{user_id}/follow` - Unfollow user
   - [x] Implement `GET /users/{user_id}/followers` - List followers
   - [x] Implement `GET /users/{user_id}/following` - List following
   - [x] Test all endpoints

4. **Bookmark Service**
   - [x] Create `app/services/bookmark_service.py`
   - [x] Implement bookmark/unbookmark functionality
   - [x] Get user's bookmarked posts
   - [x] Check if post is bookmarked
   - [x] Test bookmark operations

5. **Bookmark Schemas**
   - [x] Create `app/schemas/bookmark.py`
   - [x] Create request/response schemas

6. **Bookmark API Endpoints**
   - [x] Create `app/api/bookmarks.py`
   - [x] Implement `POST /posts/{post_id}/bookmarks` - Bookmark post
   - [x] Implement `DELETE /posts/{post_id}/bookmarks` - Remove bookmark
   - [x] Implement `GET /bookmarks` - Get user's bookmarks
   - [x] Test all endpoints

7. **Content Filter Service**
   - [x] Create `app/services/content_filter_service.py`
   - [x] Implement mute user functionality
   - [x] Implement block user functionality
   - [x] Get muted/blocked users list
   - [x] Prevent self-mute/block
   - [x] Test filter operations

8. **Content Filter API Endpoints**
   - [x] Create `app/api/content_filters.py`
   - [x] Implement `POST /users/{user_id}/mute` - Mute user
   - [x] Implement `DELETE /users/{user_id}/mute` - Unmute user
   - [x] Implement `POST /users/{user_id}/block` - Block user
   - [x] Implement `DELETE /users/{user_id}/block` - Unblock user
   - [x] Implement `GET /content-filters` - Get filters
   - [x] Test all endpoints

**Acceptance Criteria:**
- ✅ Users can follow/unfollow other users
- ✅ Users can bookmark posts
- ✅ Users can mute and block other users
- ✅ All social endpoints work correctly

**Estimated Effort:** 5-6 days

---

## Phase 7: Advanced Features (Week 8-9)

**Goal:** Implement polls, search, feed optimization, and reports.

### Epic: Advanced Platform Features

#### Tasks:
1. **Poll Service**
   - [x] Create `app/services/poll_service.py`
   - [x] Implement poll creation (optional; can be part of POST /posts with poll body)
   - [x] Implement poll voting
   - [x] Calculate poll results
   - [x] Check if poll is expired
   - [x] Check if user has voted
   - [x] Test poll operations

2. **Poll Schemas**
   - [x] Create `app/schemas/poll.py`
   - [x] Create request/response schemas (vote, results)
   - [x] Validate poll options (2-4 options) – for poll creation
   - [x] Validate duration (1-7 days) – for poll creation

3. **Poll API Endpoints**
   - [x] Create `app/api/polls.py`
   - [x] Implement `POST /polls/{poll_id}/votes` - Vote on poll
   - [x] Implement `GET /polls/{poll_id}/results` - Get poll results
   - [x] Test endpoints

4. **Search Service**
   - [x] Create `app/services/search_service.py`
   - [x] Implement user search (username, display name)
   - [x] Implement ticker search
   - [x] Combine search results (type=users|tickers|all)
   - [x] Test search functionality

5. **Search Schemas**
   - [x] Create `app/schemas/search.py`
   - [x] Create search request/response schemas

6. **Search API Endpoints**
   - [x] Create `app/api/search.py`
   - [x] Implement `GET /search` - Unified search (users + tickers only)
   - [x] Support type filtering (users, tickers, all)
   - [x] Test search endpoint

7. **Feed Service**
   - [x] Create `app/services/feed_service.py`
   - [x] Implement feed query (all posts, exclude muted/blocked)
   - [x] Fetch posts from followed users – deferred (no algo; all posts with filters)
   - [x] Apply content filters (muted/blocked users)
   - [x] Pagination (offset)
   - [x] Pre-load author, stats, interactions
   - [x] Test feed generation

8. **Feed API Endpoints**
   - [x] Create `app/api/feed.py`
   - [x] Implement `GET /feed` - Home feed (all posts, exclude muted/blocked)
   - [x] Implement pagination
   - [x] Apply user filters automatically
   - [x] Test feed endpoint performance

9. **Report Service**
   - [x] Create `app/services/report_service.py`
   - [x] Implement report creation
   - [x] Validate report targets (post, comment, user)
   - [x] Store report with metadata
   - [x] Test report operations

10. **Report Schemas**
    - [x] Create `app/schemas/report.py`
    - [x] Create request/response schemas

11. **Report API Endpoints**
    - [x] Create `app/api/reports.py`
    - [x] Implement `POST /reports` - Create report
    - [x] Test endpoint

**Acceptance Criteria:**
- ✅ Polls work with voting and results
- ✅ Search works across users and tickers (no posts)
- ✅ Feed returns all posts with muted/blocked filter applied
- ✅ Reports can be created

**Estimated Effort:** 7-9 days

---

## Phase 8: Media & File Handling (Week 9)

**Goal:** Implement media upload endpoints and file management.

### Epic: Media Management

#### Tasks:
1. **Media Upload Service**
   - [ ] Extend `app/services/storage_service.py`
   - [ ] Implement media upload to `post-media` bucket
   - [ ] Generate unique file names
   - [ ] Handle multiple file uploads
   - [ ] Test upload operations

2. **Media Validation**
   - [ ] Extend `app/utils/media_validator.py`
   - [ ] Validate multiple file types
   - [ ] Validate file sizes per file and total
   - [ ] Test validation

3. **Media API Endpoints**
   - [ ] Create `app/api/media.py`
   - [ ] Implement `POST /media/upload` - Upload media files
   - [ ] Handle multipart/form-data
   - [ ] Return public URLs
   - [ ] Test upload endpoint

**Acceptance Criteria:**
- ✅ Multiple media files can be uploaded
- ✅ Files are validated before upload
- ✅ Public URLs are returned
- ✅ Files are stored in Supabase Storage

**Estimated Effort:** 2-3 days

---

## Phase 9: Error Tracking & Logging (Week 10)

**Goal:** Implement error tracking with Sentry and logging infrastructure.

### Epic: Error Tracking System

#### Tasks:
1. **Sentry Backend Integration**
   - [ ] Create Sentry account/project
   - [ ] Get Sentry DSN
   - [ ] Install `sentry-sdk` package
   - [ ] Configure Sentry in `app/main.py`
   - [ ] Integrate FastAPI integration
   - [ ] Integrate SQLAlchemy integration
   - [ ] Test error tracking

2. **Error Logging Service**
   - [ ] Create `app/services/error_service.py`
   - [ ] Implement error logging to database
   - [ ] Implement error logging to Sentry
   - [ ] Add user context to errors
   - [ ] Add request context to errors
   - [ ] Test error logging

3. **Error Log Models & Schemas**
   - [ ] Verify `ErrorLog` model is created (from Phase 2)
   - [ ] Create `app/schemas/error.py`
   - [ ] Create error request/response schemas

4. **Error API Endpoints**
   - [ ] Create `app/api/errors.py` (or add to existing file)
   - [ ] Implement `POST /errors/log` - Log frontend errors
   - [ ] Implement `GET /errors` - Get error logs (admin)
   - [ ] Implement `PATCH /errors/{error_id}/resolve` - Mark resolved
   - [ ] Test endpoints

5. **Global Error Handler**
   - [ ] Update `app/middleware/error_handler.py`
   - [ ] Log all unhandled exceptions to Sentry
   - [ ] Log to database for critical errors
   - [ ] Test error handler

6. **Frontend Error Tracking** (Coordination with Frontend Team)
   - [ ] Install Sentry Next.js SDK in frontend
   - [ ] Configure Sentry in frontend
   - [ ] Setup error boundary
   - [ ] Test frontend error tracking

**Acceptance Criteria:**
- ✅ Backend errors are tracked in Sentry
- ✅ Frontend errors are tracked in Sentry
- ✅ Errors are logged to database
- ✅ Error logs can be retrieved via API
- ✅ Sentry dashboard shows errors correctly

**Estimated Effort:** 3-4 days

---

## Phase 10: Metrics & Analytics (Week 10-11)

**Goal:** Implement admin metrics endpoints for investors.

### Epic: Metrics & Analytics System

#### Tasks:
1. **Metrics Service**
   - [ ] Create `app/services/metrics_service.py`
   - [ ] Implement DAU calculation
   - [ ] Implement MAU calculation
   - [ ] Implement user retention calculation
   - [ ] Implement engagement metrics calculation
   - [ ] Implement growth metrics calculation
   - [ ] Implement platform health metrics
   - [ ] Use materialized views where possible
   - [ ] Test all metric calculations

2. **User Session Tracking**
   - [ ] Update user activity to track sessions
   - [ ] Implement session start/end tracking
   - [ ] Update `last_active_at` on user activity
   - [ ] Test session tracking

3. **Metrics Schemas**
   - [ ] Create `app/schemas/metrics.py`
   - [ ] Create metrics response schemas
   - [ ] Structure metrics by category

4. **Metrics API Endpoints**
   - [ ] Create `app/api/metrics.py`
   - [ ] Implement `GET /metrics/dashboard` - All metrics
   - [ ] Implement `GET /metrics/users` - User metrics
   - [ ] Implement `GET /metrics/engagement` - Engagement metrics
   - [ ] Implement `GET /metrics/growth` - Growth metrics
   - [ ] Implement `GET /metrics/health` - Platform health
   - [ ] Implement `GET /metrics/trending` - Trending content
   - [ ] Implement `GET /metrics/export` - Export metrics
   - [ ] Add admin authentication checks
   - [ ] Test all endpoints

5. **Materialized View Refresh Jobs** (Optional)
   - [ ] Setup cron job or scheduled task
   - [ ] Refresh `daily_metrics` view daily
   - [ ] Refresh `trending_tickers` view hourly
   - [ ] Document refresh schedule

**Acceptance Criteria:**
- ✅ All metrics endpoints return accurate data
- ✅ Metrics are calculated efficiently
- ✅ Materialized views are used where appropriate
- ✅ Metrics can be exported (CSV/JSON)
- ✅ Admin authentication works on metrics endpoints

**Estimated Effort:** 5-6 days

---

## Phase 11: Testing & Quality Assurance (Week 11-12)

**Goal:** Write comprehensive tests and ensure code quality.

### Epic: Testing & QA

#### Tasks:
1. **Testing Infrastructure**
   - [ ] Install pytest and testing dependencies
   - [ ] Create `tests/conftest.py` with fixtures
   - [ ] Setup test database configuration
   - [ ] Create test database helpers
   - [ ] Document test running commands

2. **Unit Tests - Services**
   - [ ] Write tests for `auth_service`
   - [ ] Write tests for `user_service`
   - [ ] Write tests for `post_service`
   - [ ] Write tests for `comment_service`
   - [ ] Write tests for `feed_service`
   - [ ] Write tests for `ticker_service`
   - [ ] Write tests for `geolocation_service`
   - [ ] Aim for 80%+ coverage

3. **Unit Tests - Utilities**
   - [ ] Write tests for `ticker_extractor`
   - [ ] Write tests for `media_validator`
   - [ ] Write tests for pagination helpers
   - [ ] Test all utility functions

4. **Integration Tests - API Endpoints**
   - [ ] Write tests for auth endpoints
   - [ ] Write tests for user endpoints
   - [ ] Write tests for post endpoints
   - [ ] Write tests for comment endpoints
   - [ ] Write tests for reaction endpoints
   - [ ] Write tests for follow endpoints
   - [ ] Write tests for bookmark endpoints
   - [ ] Test error cases (404, 401, 403, 422)

5. **Integration Tests - Complex Flows**
   - [ ] Test onboarding flow end-to-end
   - [ ] Test post creation with ticker extraction
   - [ ] Test feed generation with filters
   - [ ] Test repost flow (normal and quote)
   - [ ] Test poll creation and voting

6. **Performance Tests**
   - [ ] Test feed query performance (should be <100ms)
   - [ ] Test pagination with large datasets
   - [ ] Test concurrent requests
   - [ ] Identify and fix slow queries

7. **Security Tests**
   - [ ] Test authentication requirements
   - [ ] Test authorization (users can't modify others' data)
   - [ ] Test input validation (SQL injection, XSS)
   - [ ] Test rate limiting (if implemented)

8. **API Documentation**
   - [ ] Verify FastAPI auto-generated docs (`/docs`)
   - [ ] Test all endpoints in Swagger UI
   - [ ] Add example requests/responses
   - [ ] Document error responses

9. **Code Review & Refactoring**
   - [ ] Code review all services
   - [ ] Code review all API endpoints
   - [ ] Refactor duplicate code
   - [ ] Improve error messages
   - [ ] Add missing docstrings

**Acceptance Criteria:**
- ✅ Test coverage is 80%+
- ✅ All tests pass
- ✅ API documentation is complete
- ✅ Performance is acceptable
- ✅ Security vulnerabilities are addressed

**Estimated Effort:** 6-8 days

---

## Phase 12: Deployment & Production Setup (Week 12)

**Goal:** Deploy to Vercel and configure production environment.

### Epic: Production Deployment

#### Tasks:
1. **Vercel Configuration**
   - [ ] Create `vercel.json` configuration file
   - [ ] Configure serverless function settings
   - [ ] Setup API route mappings
   - [ ] Test Vercel configuration locally

2. **Environment Variables Setup**
   - [ ] Set all environment variables in Vercel dashboard
   - [ ] Configure Dev environment variables
   - [ ] Configure Prod environment variables
   - [ ] Document all required variables
   - [ ] Verify variables are not exposed to client

3. **Database Migrations - Production**
   - [ ] Run Alembic migrations on Prod database
   - [ ] Verify all tables are created
   - [ ] Test database connection from Vercel
   - [ ] Document migration process

4. **Supabase Storage Setup**
   - [ ] Create `profile-pictures` bucket in Prod
   - [ ] Create `post-media` bucket in Prod
   - [ ] Configure bucket policies (public read, authenticated write)
   - [ ] Test file uploads to Prod storage

5. **Sentry Production Setup**
   - [ ] Create Sentry Prod project
   - [ ] Configure Prod DSN in Vercel
   - [ ] Test error tracking in Prod
   - [ ] Setup error alerts

6. **CORS Configuration**
   - [ ] Update CORS origins for production domains
   - [ ] Test CORS headers
   - [ ] Verify preflight requests work

7. **Performance Optimization**
   - [ ] Enable connection pooling
   - [ ] Configure caching headers where appropriate
   - [ ] Optimize database queries
   - [ ] Test API response times

8. **Monitoring & Alerts**
   - [ ] Setup Vercel analytics
   - [ ] Configure Sentry alerts for critical errors
   - [ ] Monitor database performance
   - [ ] Setup uptime monitoring (optional)

9. **Documentation**
   - [ ] Update deployment documentation
   - [ ] Document production environment setup
   - [ ] Create runbook for common issues
   - [ ] Document rollback procedures

10. **Staging Deployment** (Optional but Recommended)
    - [ ] Deploy to staging environment first
    - [ ] Test all functionality in staging
    - [ ] Get stakeholder approval
    - [ ] Deploy to production

**Acceptance Criteria:**
- ✅ Backend is deployed to Vercel
- ✅ All environment variables are configured
- ✅ Database migrations run successfully
- ✅ All endpoints work in production
- ✅ Error tracking is working
- ✅ Monitoring is set up

**Estimated Effort:** 4-5 days

---

## Phase 13: Post-Launch Support & Optimization (Ongoing)

**Goal:** Monitor, optimize, and iterate based on production usage.

### Epic: Post-Launch Operations

#### Tasks:
1. **Monitoring & Maintenance**
   - [ ] Monitor error rates daily
   - [ ] Review slow queries weekly
   - [ ] Monitor database performance
   - [ ] Review Sentry errors and fix critical issues

2. **Performance Optimization**
   - [ ] Identify and optimize slow endpoints
   - [ ] Add database indexes as needed
   - [ ] Implement caching where beneficial
   - [ ] Optimize materialized view refresh schedules

3. **Feature Iterations**
   - [ ] Gather user feedback
   - [ ] Prioritize feature requests
   - [ ] Implement incremental improvements
   - [ ] A/B test new features

4. **Scaling Preparation**
   - [ ] Monitor resource usage
   - [ ] Plan for increased load
   - [ ] Optimize database queries
   - [ ] Consider read replicas if needed

**Estimated Effort:** Ongoing

---

## Sprint Planning Guide

### Recommended Sprint Structure
- **Sprint Duration:** 1-2 weeks
- **Sprint Size:** 3-5 story points per task (rough estimate)
- **Team Size:** 2 developers

### Sprint Breakdown Examples

**Sprint 1 (Week 1):**
- Phase 0: Complete
- Phase 1: Tasks 1-3

**Sprint 2 (Week 2):**
- Phase 1: Tasks 4-5
- Phase 2: Tasks 1-2

**Sprint 3 (Week 3):**
- Phase 2: Tasks 3-7

**Sprint 4 (Week 4):**
- Phase 3: Complete

**Sprint 5-6 (Weeks 5-6):**
- Phase 4: Complete

**Sprint 7-8 (Weeks 7-8):**
- Phase 5: Complete

**Sprint 9 (Week 9):**
- Phase 6: Complete
- Phase 7: Tasks 1-3

**Sprint 10 (Week 10):**
- Phase 7: Tasks 4-12
- Phase 8: Complete

**Sprint 11 (Week 11):**
- Phase 9: Complete
- Phase 10: Tasks 1-3

**Sprint 12 (Week 12):**
- Phase 10: Tasks 4-5
- Phase 11: Tasks 1-4

**Sprint 13 (Week 13):**
- Phase 11: Tasks 5-9
- Phase 12: Tasks 1-3

**Sprint 14 (Week 14):**
- Phase 12: Tasks 4-10

---

## Dependencies & Prerequisites

### Critical Path Dependencies
1. **Phase 1 → Phase 2:** Database connection required for models
2. **Phase 2 → Phase 3:** Models required for authentication
3. **Phase 3 → All Other Phases:** Authentication required for protected endpoints
4. **Phase 4 → Phase 5:** User model needed for posts
5. **Phase 5 → Phase 6:** Posts needed for bookmarks
6. **Phase 5 → Phase 7:** Posts needed for feed

### Parallel Work Opportunities
- Phase 8 (Media) can be done in parallel with Phase 7
- Phase 9 (Error Tracking) can start after Phase 3
- Phase 10 (Metrics) can start after Phase 2 (needs data)
- Phase 11 (Testing) can be done incrementally throughout

---

## Risk Mitigation

### High-Risk Areas
1. **Database Performance** - Monitor and optimize queries early
2. **Authentication** - Critical for security, test thoroughly
3. **Feed Optimization** - Complex queries, need performance testing
4. **File Uploads** - Storage costs and performance

### Mitigation Strategies
- Regular code reviews
- Early performance testing
- Incremental testing throughout development
- Backup and rollback plans for migrations

---

## Success Metrics

### Phase Completion Criteria
- All tasks completed and tested
- Code reviewed and approved
- Documentation updated
- No critical bugs
- Performance benchmarks met

### Overall Project Success
- ✅ All features implemented
- ✅ 80%+ test coverage
- ✅ API documentation complete
- ✅ Deployed to production
- ✅ Error tracking active
- ✅ Metrics endpoints working

---

**Document Status:** ✅ Complete  
**Ready for Jira Import:** Yes  
**Last Updated:** January 2026
