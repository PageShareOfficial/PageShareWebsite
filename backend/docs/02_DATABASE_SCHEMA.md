# PageShare Backend - Database Schema

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Database:** Supabase PostgreSQL (Dev & Prod)

---

## Overview

This document defines the complete database schema for PageShare, including all tables, relationships, indexes, constraints, and data types. The schema supports all frontend features including posts, comments, reactions, reposts, polls, bookmarks, content filters, and more.

---

## Database Conventions

- **Primary Keys:** UUID (`gen_random_uuid()`)
- **Timestamps:** `TIMESTAMPTZ` (timezone-aware)
- **Soft Deletes:** Use `deleted_at` for soft deletion where needed
- **Indexes:** Created on foreign keys, frequently queried columns, and composite keys
- **Constraints:** Unique constraints where needed, foreign key constraints for referential integrity

---

## Tables

### 1. `users` - User Profiles

Extends Supabase `auth.users` with additional profile information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    profile_picture_url TEXT,
    badge VARCHAR(20) CHECK (badge IN ('Verified', 'Public')),
    date_of_birth DATE,
    timezone VARCHAR(50), -- IANA timezone (e.g., "America/New_York")
    country VARCHAR(100), -- Country name from IP geolocation
    country_code VARCHAR(2), -- ISO 3166-1 alpha-2 country code (e.g., "US")
    ip_address_hash VARCHAR(64), -- SHA-256 hash of IP address (privacy)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,50}$'),
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_active_at ON users(last_active_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

**Fields:**
- `id` - UUID from Supabase auth.users
- `username` - Unique lowercase username (3-50 chars, alphanumeric + underscore)
- `display_name` - User's display name
- `bio` - User biography
- `profile_picture_url` - URL to profile picture (Google OAuth or Supabase Storage)
- `badge` - User badge (Verified, Public)
- `date_of_birth` - Optional date of birth
- `timezone` - User timezone
- `country` - User country
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_active_at` - Last activity timestamp (for DAU/MAU metrics)
- `deleted_at` - Soft delete timestamp

---

### 2. `posts` - Posts/Tweets

Main content posts from users.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[], -- Array of image URLs
    gif_url TEXT, -- GIF URL from Giphy
    original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- For quote reposts
    repost_type VARCHAR(10) CHECK (repost_type IN ('normal', 'quote')), -- NULL = original post
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR media_urls IS NOT NULL OR gif_url IS NOT NULL),
    CONSTRAINT max_content_length CHECK (LENGTH(content) <= 10000)
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_original_post_id ON posts(original_post_id);
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
```

**Fields:**
- `id` - Unique post ID
- `user_id` - Post author
- `content` - Post text content (max 10,000 chars)
- `media_urls` - Array of image URLs
- `gif_url` - GIF URL (from Giphy)
- `original_post_id` - Reference to original post (for quote reposts)
- `repost_type` - Type of repost: `normal` (simple repost) or `quote` (repost with comment)
- `created_at` - Post creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

---

### 3. `comments` - Comments on Posts

Comments/replies to posts.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
    content TEXT NOT NULL,
    media_urls TEXT[], -- Array of image URLs
    gif_url TEXT, -- GIF URL from Giphy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR media_urls IS NOT NULL OR gif_url IS NOT NULL),
    CONSTRAINT max_content_length CHECK (LENGTH(content) <= 10000)
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC) WHERE deleted_at IS NULL;
```

**Fields:**
- `id` - Unique comment ID
- `post_id` - Post being commented on
- `user_id` - Comment author
- `parent_comment_id` - Parent comment (for nested replies, future feature)
- `content` - Comment text content
- `media_urls` - Array of image URLs
- `gif_url` - GIF URL (from Giphy)
- `created_at` - Comment creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

---

### 4. `tickers` - Stock/Crypto Tickers

Ticker symbols extracted from posts.

```sql
CREATE TABLE tickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) UNIQUE NOT NULL, -- e.g., "AAPL", "BTC"
    name VARCHAR(200), -- Full name, e.g., "Apple Inc."
    type VARCHAR(20) CHECK (type IN ('stock', 'crypto', 'etf', 'other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT symbol_uppercase CHECK (symbol = UPPER(symbol))
);

CREATE INDEX idx_tickers_symbol ON tickers(symbol);
CREATE INDEX idx_tickers_type ON tickers(type);
CREATE INDEX idx_tickers_created_at ON tickers(created_at);
```

**Fields:**
- `id` - Unique ticker ID
- `symbol` - Ticker symbol (uppercase, unique)
- `name` - Full ticker name
- `type` - Ticker type (stock, crypto, etf, other)
- `created_at` - Ticker creation timestamp

---

### 5. `post_tickers` - Post-Ticker Junction

Many-to-many relationship between posts and tickers.

```sql
CREATE TABLE post_tickers (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    ticker_id UUID NOT NULL REFERENCES tickers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (post_id, ticker_id)
);

CREATE INDEX idx_post_tickers_post_id ON post_tickers(post_id);
CREATE INDEX idx_post_tickers_ticker_id ON post_tickers(ticker_id);
CREATE INDEX idx_post_tickers_created_at ON post_tickers(created_at DESC);
```

**Fields:**
- `post_id` - Post ID
- `ticker_id` - Ticker ID
- `created_at` - Relationship creation timestamp

---

### 6. `reactions` - Likes/Reactions

Reactions (likes) on posts and comments.

```sql
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT reaction_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id) WHERE post_id IS NOT NULL,
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id) WHERE comment_id IS NOT NULL
);

CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX idx_reactions_created_at ON reactions(created_at);
```

**Fields:**
- `id` - Unique reaction ID
- `user_id` - User who reacted
- `post_id` - Post being reacted to (mutually exclusive with comment_id)
- `comment_id` - Comment being reacted to (mutually exclusive with post_id)
- `created_at` - Reaction timestamp

**Constraints:**
- Reaction must target either a post OR a comment (not both)
- One reaction per user per post/comment (unique constraint)

---

### 7. `reposts` - Reposts

Reposts (both normal and quote reposts).

```sql
CREATE TABLE reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('normal', 'quote')),
    quote_content TEXT, -- Additional content for quote reposts
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_post_repost UNIQUE (user_id, post_id)
);

CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_created_at ON reposts(created_at DESC);
CREATE INDEX idx_reposts_type ON reposts(type);
```

**Fields:**
- `id` - Unique repost ID
- `user_id` - User who reposted
- `post_id` - Original post being reposted
- `type` - Repost type: `normal` (simple) or `quote` (with comment)
- `quote_content` - Additional content for quote reposts
- `created_at` - Repost timestamp

**Note:** For quote reposts, a new `post` record is also created with `repost_type='quote'` and `original_post_id` pointing to the original post.

---

### 8. `follows` - Follow Relationships

User follow/following relationships.

```sql
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);
```

**Fields:**
- `follower_id` - User who is following
- `following_id` - User being followed
- `created_at` - Follow relationship timestamp

**Constraints:**
- Users cannot follow themselves

---

### 9. `bookmarks` - Bookmarks

User bookmarks for posts.

```sql
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
```

**Fields:**
- `id` - Unique bookmark ID
- `user_id` - User who bookmarked
- `post_id` - Bookmarked post
- `created_at` - Bookmark timestamp

---

### 10. `polls` - Polls

Polls attached to posts or comments.

```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    options TEXT[] NOT NULL, -- Array of poll options
    duration_days INTEGER NOT NULL DEFAULT 1, -- Poll duration in days
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT poll_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT min_options CHECK (ARRAY_LENGTH(options, 1) >= 2),
    CONSTRAINT max_options CHECK (ARRAY_LENGTH(options, 1) <= 4),
    CONSTRAINT min_duration CHECK (duration_days > 0 AND duration_days <= 7)
);

CREATE INDEX idx_polls_post_id ON polls(post_id);
CREATE INDEX idx_polls_comment_id ON polls(comment_id);
CREATE INDEX idx_polls_created_at ON polls(created_at);
```

**Fields:**
- `id` - Unique poll ID
- `post_id` - Post with poll (mutually exclusive with comment_id)
- `comment_id` - Comment with poll (mutually exclusive with post_id)
- `options` - Array of poll options (2-4 options)
- `duration_days` - Poll duration in days (1-7 days)
- `created_at` - Poll creation timestamp

---

### 11. `poll_votes` - Poll Votes

Votes on poll options.

```sql
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL, -- Index of selected option (0-based)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_poll_vote UNIQUE (user_id, poll_id),
    CONSTRAINT valid_option_index CHECK (option_index >= 0)
);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_created_at ON poll_votes(created_at);
```

**Fields:**
- `id` - Unique vote ID
- `poll_id` - Poll being voted on
- `user_id` - User who voted
- `option_index` - Index of selected option (0-based)
- `created_at` - Vote timestamp

---

### 12. `content_filters` - Muted/Blocked Users

User content filtering (mute/block).

```sql
CREATE TABLE content_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filtered_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filter_type VARCHAR(10) NOT NULL CHECK (filter_type IN ('mute', 'block')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_filter UNIQUE (user_id, filtered_user_id, filter_type),
    CONSTRAINT no_self_filter CHECK (user_id != filtered_user_id)
);

CREATE INDEX idx_content_filters_user_id ON content_filters(user_id);
CREATE INDEX idx_content_filters_filtered_user_id ON content_filters(filtered_user_id);
CREATE INDEX idx_content_filters_type ON content_filters(filter_type);
```

**Fields:**
- `id` - Unique filter ID
- `user_id` - User applying the filter
- `filtered_user_id` - User being filtered
- `filter_type` - Filter type: `mute` (hide posts) or `block` (full block)
- `created_at` - Filter creation timestamp

---

### 13. `reports` - Content Reports

User reports for content moderation.

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    reported_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- e.g., "spam", "harassment", "inappropriate"
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    
    CONSTRAINT report_target CHECK (
        (reported_post_id IS NOT NULL AND reported_comment_id IS NULL AND reported_user_id IS NULL) OR
        (reported_post_id IS NULL AND reported_comment_id IS NOT NULL AND reported_user_id IS NULL) OR
        (reported_post_id IS NULL AND reported_comment_id IS NULL AND reported_user_id IS NOT NULL)
    )
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_post_id ON reports(reported_post_id);
CREATE INDEX idx_reports_reported_comment_id ON reports(reported_comment_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

**Fields:**
- `id` - Unique report ID
- `reporter_id` - User making the report
- `reported_post_id` - Reported post (mutually exclusive)
- `reported_comment_id` - Reported comment (mutually exclusive)
- `reported_user_id` - Reported user (mutually exclusive)
- `report_type` - Type of report (spam, harassment, etc.)
- `reason` - Optional reason for report
- `status` - Report status (pending, reviewed, resolved, dismissed)
- `created_at` - Report creation timestamp
- `reviewed_at` - When report was reviewed
- `reviewed_by` - Admin who reviewed (future)

---

### 14. `user_interests` - User Interests

User interests from onboarding.

```sql
CREATE TABLE user_interests (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, interest)
);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest ON user_interests(interest);
```

**Fields:**
- `user_id` - User ID
- `interest` - Interest name (e.g., "Stocks", "Crypto", "ETFs")
- `created_at` - Interest assignment timestamp

---

### 15. `watchlist_items` - User Watchlist

User's watchlist of tickers (for future use, currently frontend-only).

```sql
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker_id UUID NOT NULL REFERENCES tickers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_ticker_watchlist UNIQUE (user_id, ticker_id)
);

CREATE INDEX idx_watchlist_items_user_id ON watchlist_items(user_id);
CREATE INDEX idx_watchlist_items_ticker_id ON watchlist_items(ticker_id);
CREATE INDEX idx_watchlist_items_created_at ON watchlist_items(created_at DESC);
```

**Fields:**
- `id` - Unique watchlist item ID
- `user_id` - User who added to watchlist
- `ticker_id` - Ticker being watched
- `created_at` - Watchlist addition timestamp

---

### 16. `error_logs` - Error Tracking Logs

Backend and frontend error logs for monitoring and debugging.

```sql
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(50) NOT NULL, -- 'backend', 'frontend', 'api', 'database'
    error_code VARCHAR(50),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_path TEXT,
    request_method VARCHAR(10),
    request_id VARCHAR(100), -- For request tracing
    user_agent TEXT,
    ip_address_hash VARCHAR(64), -- SHA-256 hash of IP
    environment VARCHAR(20) NOT NULL, -- 'development', 'production'
    severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    metadata JSONB, -- Additional error context
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_error_logs_environment ON error_logs(environment);
```

**Fields:**
- `id` - Unique error log ID
- `error_type` - Type of error (backend, frontend, api, database)
- `error_code` - Error code (e.g., "AUTH_INVALID", "NOT_FOUND")
- `error_message` - Error message
- `stack_trace` - Stack trace for debugging
- `user_id` - User who encountered error (if applicable)
- `request_path` - API endpoint path
- `request_method` - HTTP method
- `request_id` - Request ID for tracing
- `user_agent` - User agent string
- `ip_address_hash` - Hashed IP address (privacy)
- `environment` - Environment (development, production)
- `severity` - Error severity level
- `resolved` - Whether error is resolved
- `resolved_at` - When error was resolved
- `resolved_by` - Admin who resolved
- `metadata` - Additional JSON context
- `created_at` - Error timestamp

---

### 17. `user_sessions` - User Session Tracking

Track user sessions for metrics (DAU, MAU calculation).

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    country_code VARCHAR(2),
    actions_count INTEGER DEFAULT 0, -- Number of actions in session
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_start ON user_sessions(session_start DESC);
CREATE INDEX idx_user_sessions_user_start ON user_sessions(user_id, session_start DESC);
```

**Fields:**
- `id` - Unique session ID
- `user_id` - User ID
- `session_start` - Session start timestamp
- `session_end` - Session end timestamp (null if active)
- `ip_address_hash` - Hashed IP address
- `user_agent` - User agent string
- `country_code` - User country
- `actions_count` - Number of actions (posts, comments, etc.)
- `created_at` - Session creation timestamp

**Note:** Used for calculating DAU/MAU metrics and tracking user activity.

---

## Views & Materialized Views

### View: `post_stats` - Post Statistics

Aggregated statistics for posts.

```sql
CREATE VIEW post_stats AS
SELECT
    p.id AS post_id,
    COUNT(DISTINCT r.id) AS reaction_count,
    COUNT(DISTINCT c.id) AS comment_count,
    COUNT(DISTINCT rp.id) AS repost_count,
    COUNT(DISTINCT b.id) AS bookmark_count
FROM posts p
LEFT JOIN reactions r ON r.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
LEFT JOIN reposts rp ON rp.post_id = p.id
LEFT JOIN bookmarks b ON b.post_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;
```

### Materialized View: `trending_tickers` - Trending Tickers

Cached trending tickers (refresh periodically).

```sql
CREATE MATERIALIZED VIEW trending_tickers AS
SELECT
    t.id AS ticker_id,
    t.symbol,
    t.name,
    COUNT(DISTINCT pt.post_id) AS mention_count,
    COUNT(DISTINCT pt.post_id) FILTER (WHERE p.created_at >= NOW() - INTERVAL '24 hours') AS mentions_24h,
    MAX(p.created_at) AS last_mentioned_at
FROM tickers t
JOIN post_tickers pt ON pt.ticker_id = t.id
JOIN posts p ON p.id = pt.post_id AND p.deleted_at IS NULL
GROUP BY t.id, t.symbol, t.name
ORDER BY mentions_24h DESC, mention_count DESC;

CREATE UNIQUE INDEX idx_trending_tickers_ticker_id ON trending_tickers(ticker_id);

-- Refresh command (run via cron or scheduled job):
-- REFRESH MATERIALIZED VIEW trending_tickers;
```

### Materialized View: `daily_metrics` - Daily Aggregated Metrics

Pre-computed daily metrics for fast dashboard queries.

```sql
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
    DATE(created_at) AS metric_date,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS dau, -- Daily active users
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS mau, -- Monthly active users
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS posts_today,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '7 days') AS posts_7d,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS posts_30d,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS new_users_today,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '7 days') AS new_users_7d,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS new_users_30d
FROM posts
WHERE deleted_at IS NULL
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);

-- Refresh command (run daily via cron):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
```

### Materialized View: `engagement_metrics` - Engagement Statistics

Pre-computed engagement metrics.

```sql
CREATE MATERIALIZED VIEW engagement_metrics AS
SELECT
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT c.id) AS total_comments,
    COUNT(DISTINCT r.id) AS total_reactions,
    COUNT(DISTINCT rp.id) AS total_reposts,
    COUNT(DISTINCT p.user_id) AS users_with_posts,
    ROUND(COUNT(DISTINCT p.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.user_id), 0), 2) AS avg_posts_per_user,
    ROUND(COUNT(DISTINCT c.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_comments_per_post,
    ROUND(COUNT(DISTINCT r.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_reactions_per_post,
    ROUND(COUNT(DISTINCT rp.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_reposts_per_post
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
LEFT JOIN reactions r ON r.post_id = p.id
LEFT JOIN reposts rp ON rp.post_id = p.id
WHERE p.deleted_at IS NULL;

-- Refresh command:
-- REFRESH MATERIALIZED VIEW engagement_metrics;
```

---

## Functions & Triggers

### Function: `update_updated_at()` - Auto-update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Update `updated_at` on posts

```sql
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Trigger: Update `updated_at` on comments

```sql
CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Trigger: Update `updated_at` on users

```sql
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## Indexes Summary

### Primary Indexes (Already defined in table definitions)
- All primary keys
- All foreign keys
- Unique constraints

### Performance Indexes (Additional)
- Composite indexes for common query patterns
- Partial indexes for soft-deleted records
- Indexes on timestamp columns for time-based queries

### Index Maintenance
- Monitor index usage
- Reindex periodically
- Drop unused indexes

---

## Database Migrations

### Migration Strategy
1. **Development:** Test migrations on dev database
2. **Review:** Check migration SQL for correctness
3. **Production:** Run migration on prod database during maintenance window
4. **Rollback:** Keep rollback migrations ready

### Migration Tools
- **Alembic** - Python migration tool
- **Version Control** - All migrations in `alembic/versions/`
- **Naming:** `YYYYMMDD_HHMMSS_description.py`

---

## Data Retention & Cleanup

### Soft Deletes
- Most tables use `deleted_at` for soft deletion
- Keep deleted records for 30 days (configurable)
- Hard delete after retention period

### Cleanup Jobs (Future)
- Delete soft-deleted records older than 30 days
- Clean up orphaned records
- Refresh materialized views

---

## Backup Strategy

### Supabase Managed Backups
- **Daily Backups:** Automatic daily backups
- **Point-in-Time Recovery:** Available for prod database
- **Manual Backups:** Before major migrations

### Export Strategy
- Regular exports of critical tables
- Store exports in secure location
- Test restore procedures

---

## Environment-Specific Configuration

### Development Database
- Can be reset/cleared frequently
- Test data generation
- Lower resource limits

### Production Database
- Permanent data, backed up regularly
- Higher resource limits
- Monitoring and alerting enabled

---

## Environment Variables for Backend

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - Supabase JWT secret

### Optional Environment Variables
- `SENTRY_DSN` - Sentry error tracking DSN
- `IPAPI_API_KEY` - IP geolocation API key (optional, free tier works without)
- `IP_API_KEY` - Alternative IP geolocation API key

---

**Document Status:** ✅ Complete  
**Database Version:** 1.0.0  
**Next:** Implement models using SQLAlchemy
