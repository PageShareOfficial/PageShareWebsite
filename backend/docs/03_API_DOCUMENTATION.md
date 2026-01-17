# PageShare Backend - API Documentation

**Version:** 1.0.0  
**Base URL:** `https://your-backend.vercel.app/api/v1`  
**Authentication:** Bearer Token (JWT from Supabase Auth)

---

## Overview

This document describes all API endpoints, request/response formats, error codes, and status codes for the PageShare backend API.

**API Version:** `/api/v1`  
**Content-Type:** `application/json` (unless specified otherwise)  
**Authentication:** Include JWT token in `Authorization: Bearer <token>` header

---

## Common Response Formats

### Success Response
```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-01-16T10:00:00Z"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Paginated Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false,
    "cursor": "optional-cursor-for-next-page"
  },
  "meta": {
    "timestamp": "2026-01-16T10:00:00Z"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid or expired token |
| `AUTH_MALFORMED` | 401 | Malformed authorization header |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict (e.g., already exists) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `FILE_TOO_LARGE` | 413 | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | 415 | Invalid file type |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (successful deletion) |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `413` | Payload Too Large |
| `415` | Unsupported Media Type |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

---

## Authentication Endpoints

### POST `/auth/verify`

Verify JWT token and get current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "valid": true,
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "display_name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**
- `401 AUTH_INVALID` - Invalid or expired token
- `401 AUTH_MALFORMED` - Missing or malformed authorization header

---

## User Endpoints

### GET `/users/me`

Get current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "bio": "Trader and investor",
    "profile_picture_url": "https://...",
    "badge": "Verified",
    "country": "USA",
    "timezone": "America/New_York",
    "follower_count": 1250,
    "following_count": 342,
    "post_count": 567,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required

---

### GET `/users/{user_id}`

Get user profile by ID.

**Path Parameters:**
- `user_id` (UUID, required) - User ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "bio": "Trader and investor",
    "profile_picture_url": "https://...",
    "badge": "Verified",
    "follower_count": 1250,
    "following_count": 342,
    "post_count": 567,
    "is_following": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `404 NOT_FOUND` - User not found

---

### PATCH `/users/me`

Update current user's profile.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "display_name": "John Doe Updated",
  "bio": "Updated bio",
  "timezone": "America/Los_Angeles",
  "country": "USA",
  "date_of_birth": "1990-01-01"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe Updated",
    "bio": "Updated bio",
    "updated_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `422 VALIDATION_ERROR` - Invalid input data

---

### POST `/users/me/profile-picture`

Upload profile picture.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file` (file, required) - Image file (JPEG, PNG, WebP, max 5MB)

**Response:** `200 OK`
```json
{
  "data": {
    "profile_picture_url": "https://[project].supabase.co/storage/v1/object/public/profile-pictures/user_123/1698765432_image.jpg"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `413 FILE_TOO_LARGE` - File exceeds 5MB limit
- `415 INVALID_FILE_TYPE` - Invalid file type
- `500 INTERNAL_ERROR` - Upload failed

---

### DELETE `/users/me/profile-picture`

Delete profile picture (revert to default).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required

---

## Post Endpoints

### POST `/posts`

Create a new post.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Great analysis on $AAPL! 🚀",
  "media_urls": ["https://..."],
  "gif_url": "https://media.giphy.com/...",
  "poll": {
    "options": ["Bullish", "Bearish", "Neutral"],
    "duration_days": 3
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "Great analysis on $AAPL! 🚀",
    "media_urls": ["https://..."],
    "gif_url": "https://media.giphy.com/...",
    "stats": {
      "likes": 0,
      "comments": 0,
      "reposts": 0
    },
    "user_interactions": {
      "liked": false,
      "reposted": false
    },
    "tickers": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc."
      }
    ],
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `422 VALIDATION_ERROR` - Invalid input (content too long, invalid poll, etc.)

---

### GET `/posts`

Get posts feed (paginated).

**Query Parameters:**
- `page` (integer, optional, default: 1) - Page number
- `per_page` (integer, optional, default: 20, max: 50) - Items per page
- `user_id` (UUID, optional) - Filter by user ID
- `ticker` (string, optional) - Filter by ticker symbol
- `cursor` (string, optional) - Cursor for pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "display_name": "John Doe",
        "profile_picture_url": "https://...",
        "badge": "Verified"
      },
      "content": "Great analysis on $AAPL! 🚀",
      "media_urls": ["https://..."],
      "stats": {
        "likes": 42,
        "comments": 5,
        "reposts": 12
      },
      "user_interactions": {
        "liked": true,
        "reposted": false
      },
      "tickers": [
        {
          "symbol": "AAPL",
          "name": "Apple Inc."
        }
      ],
      "created_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "has_next": true,
    "has_prev": false,
    "cursor": "next-page-cursor"
  }
}
```

---

### GET `/posts/{post_id}`

Get single post with details.

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "author": {
      "id": "uuid",
      "username": "johndoe",
      "display_name": "John Doe",
      "profile_picture_url": "https://...",
      "badge": "Verified"
    },
    "content": "Great analysis on $AAPL! 🚀",
    "media_urls": ["https://..."],
    "stats": {
      "likes": 42,
      "comments": 5,
      "reposts": 12
    },
    "user_interactions": {
      "liked": true,
      "reposted": false
    },
    "tickers": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc."
      }
    ],
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `404 NOT_FOUND` - Post not found

---

### DELETE `/posts/{post_id}`

Delete a post (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `403 PERMISSION_DENIED` - Not the post owner
- `404 NOT_FOUND` - Post not found

---

## Comment Endpoints

### POST `/posts/{post_id}/comments`

Create a comment on a post.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Request Body:**
```json
{
  "content": "I agree with this analysis!",
  "media_urls": ["https://..."],
  "gif_url": "https://media.giphy.com/..."
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "author": {
      "id": "uuid",
      "username": "janedoe",
      "display_name": "Jane Doe",
      "profile_picture_url": "https://..."
    },
    "content": "I agree with this analysis!",
    "likes": 0,
    "user_liked": false,
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Post not found
- `422 VALIDATION_ERROR` - Invalid input

---

### GET `/posts/{post_id}/comments`

Get comments for a post (paginated).

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "username": "janedoe",
        "display_name": "Jane Doe",
        "profile_picture_url": "https://..."
      },
      "content": "I agree with this analysis!",
      "likes": 5,
      "user_liked": false,
      "created_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "has_next": true
  }
}
```

---

### DELETE `/comments/{comment_id}`

Delete a comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `comment_id` (UUID, required) - Comment ID

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `403 PERMISSION_DENIED` - Not the comment owner
- `404 NOT_FOUND` - Comment not found

---

## Reaction Endpoints

### POST `/posts/{post_id}/reactions`

Toggle reaction (like/unlike) on a post.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Response:** `200 OK`
```json
{
  "data": {
    "reacted": true,
    "reaction_count": 43
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Post not found

---

### POST `/comments/{comment_id}/reactions`

Toggle reaction (like/unlike) on a comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `comment_id` (UUID, required) - Comment ID

**Response:** `200 OK`
```json
{
  "data": {
    "reacted": true,
    "reaction_count": 6
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Comment not found

---

## Repost Endpoints

### POST `/posts/{post_id}/reposts`

Create a repost (normal or quote).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID to repost

**Request Body (Normal Repost):**
```json
{
  "type": "normal"
}
```

**Request Body (Quote Repost):**
```json
{
  "type": "quote",
  "quote_content": "Adding my thoughts: ...",
  "media_urls": ["https://..."],
  "gif_url": "https://media.giphy.com/..."
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "type": "quote",
    "original_post": {
      "id": "uuid",
      "author": {
        "username": "johndoe",
        "display_name": "John Doe"
      },
      "content": "Original post content"
    },
    "quote_content": "Adding my thoughts: ...",
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Post not found
- `409 CONFLICT` - Already reposted
- `422 VALIDATION_ERROR` - Invalid input

---

### DELETE `/posts/{post_id}/reposts`

Remove a repost (undo repost).

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `post_id` (UUID, required) - Original post ID

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Repost not found

---

## Follow Endpoints

### POST `/users/{user_id}/follow`

Follow a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to follow

**Response:** `201 Created`
```json
{
  "data": {
    "following": true,
    "follower_count": 1251
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - User not found
- `409 CONFLICT` - Already following or cannot follow self

---

### DELETE `/users/{user_id}/follow`

Unfollow a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to unfollow

**Response:** `200 OK`
```json
{
  "data": {
    "following": false,
    "follower_count": 1250
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Follow relationship not found

---

### GET `/users/{user_id}/followers`

Get user's followers (paginated).

**Path Parameters:**
- `user_id` (UUID, required) - User ID

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "follower1",
      "display_name": "Follower One",
      "profile_picture_url": "https://...",
      "is_following": false,
      "followed_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1250
  }
}
```

---

### GET `/users/{user_id}/following`

Get users that a user is following (paginated).

**Path Parameters:**
- `user_id` (UUID, required) - User ID

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "following1",
      "display_name": "Following One",
      "profile_picture_url": "https://...",
      "is_following": true,
      "followed_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 342
  }
}
```

---

## Bookmark Endpoints

### POST `/posts/{post_id}/bookmarks`

Bookmark a post.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Response:** `201 Created`
```json
{
  "data": {
    "bookmarked": true
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Post not found
- `409 CONFLICT` - Already bookmarked

---

### DELETE `/posts/{post_id}/bookmarks`

Remove bookmark from a post.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `post_id` (UUID, required) - Post ID

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Bookmark not found

---

### GET `/bookmarks`

Get current user's bookmarked posts (paginated).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "author": {
        "username": "johndoe",
        "display_name": "John Doe"
      },
      "content": "Bookmarked post content",
      "bookmarked_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45
  }
}
```

---

## Poll Endpoints

### POST `/polls/{poll_id}/votes`

Vote on a poll option.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `poll_id` (UUID, required) - Poll ID

**Request Body:**
```json
{
  "option_index": 0
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "voted": true,
    "option_index": 0,
    "results": {
      "0": 42,
      "1": 15,
      "2": 8
    },
    "total_votes": 65
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - Poll not found
- `409 CONFLICT` - Already voted
- `422 VALIDATION_ERROR` - Invalid option_index or poll expired

---

### GET `/polls/{poll_id}/results`

Get poll results.

**Path Parameters:**
- `poll_id` (UUID, required) - Poll ID

**Response:** `200 OK`
```json
{
  "data": {
    "poll_id": "uuid",
    "options": ["Bullish", "Bearish", "Neutral"],
    "results": {
      "0": 42,
      "1": 15,
      "2": 8
    },
    "total_votes": 65,
    "user_vote": 0,
    "is_finished": false,
    "expires_at": "2026-01-19T10:00:00Z"
  }
}
```

---

## Ticker Endpoints

### GET `/tickers/{symbol}`

Get ticker details and related posts.

**Path Parameters:**
- `symbol` (string, required) - Ticker symbol (e.g., "AAPL", "BTC")

**Query Parameters:**
- `page` (integer, optional, default: 1) - For posts pagination
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": {
    "ticker": {
      "id": "uuid",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "type": "stock"
    },
    "posts": [
      {
        "id": "uuid",
        "author": {
          "username": "johndoe",
          "display_name": "John Doe"
        },
        "content": "Great analysis on $AAPL!",
        "created_at": "2026-01-16T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150
    }
  }
}
```

**Error Responses:**
- `404 NOT_FOUND` - Ticker not found

---

### GET `/tickers/trending`

Get trending tickers.

**Query Parameters:**
- `limit` (integer, optional, default: 10, max: 50) - Number of trending tickers

**Response:** `200 OK`
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "mention_count": 450,
      "mentions_24h": 125,
      "last_mentioned_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

---

## Search Endpoints

### GET `/search`

Unified search (users, posts, tickers).

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string, optional) - Filter by type: `users`, `posts`, `tickers`, or `all` (default)
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "johndoe",
        "display_name": "John Doe",
        "profile_picture_url": "https://..."
      }
    ],
    "posts": [
      {
        "id": "uuid",
        "content": "Search result post",
        "author": {
          "username": "johndoe"
        }
      }
    ],
    "tickers": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc."
      }
    ]
  },
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

---

## Feed Endpoints

### GET `/feed`

Get personalized home feed (posts from followed users).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)
- `cursor` (string, optional) - Cursor for pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "author": {
        "username": "followed_user",
        "display_name": "Followed User"
      },
      "content": "Feed post content",
      "created_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "has_next": true,
    "cursor": "next-cursor"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required

---

## Content Filter Endpoints

### POST `/users/{user_id}/mute`

Mute a user (hide their posts).

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to mute

**Response:** `201 Created`
```json
{
  "data": {
    "muted": true
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - User not found
- `409 CONFLICT` - Already muted or cannot mute self

---

### DELETE `/users/{user_id}/mute`

Unmute a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to unmute

**Response:** `204 No Content`

---

### POST `/users/{user_id}/block`

Block a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to block

**Response:** `201 Created`
```json
{
  "data": {
    "blocked": true
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `404 NOT_FOUND` - User not found
- `409 CONFLICT` - Already blocked or cannot block self

---

### DELETE `/users/{user_id}/block`

Unblock a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (UUID, required) - User ID to unblock

**Response:** `204 No Content`

---

### GET `/content-filters`

Get current user's muted and blocked users.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "muted_users": [
      {
        "id": "uuid",
        "username": "muted_user",
        "display_name": "Muted User",
        "muted_at": "2026-01-16T10:00:00Z"
      }
    ],
    "blocked_users": [
      {
        "id": "uuid",
        "username": "blocked_user",
        "display_name": "Blocked User",
        "blocked_at": "2026-01-16T10:00:00Z"
      }
    ]
  }
}
```

---

## Report Endpoints

### POST `/reports`

Report content or user.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reported_post_id": "uuid", // or reported_comment_id or reported_user_id
  "report_type": "spam", // or "harassment", "inappropriate", etc.
  "reason": "Optional reason text"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "status": "pending",
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `422 VALIDATION_ERROR` - Invalid input (must specify one target)

---

## Media Endpoints

### POST `/media/upload`

Upload media file (for posts/comments).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file` (file, required) - Image file (JPEG, PNG, WebP, max 5MB)

**Response:** `201 Created`
```json
{
  "data": {
    "url": "https://[project].supabase.co/storage/v1/object/public/media/user_123/image.jpg",
    "file_name": "image.jpg",
    "file_size": 1024000,
    "content_type": "image/jpeg"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `413 FILE_TOO_LARGE` - File exceeds 5MB
- `415 INVALID_FILE_TYPE` - Invalid file type

---

## Rate Limiting

### Limits
- **Authenticated:** 1000 requests per hour per user
- **Unauthenticated:** 100 requests per hour per IP
- **File Uploads:** 10 uploads per hour per user

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

### Error Response
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 3600
  }
}
```

---

## Pagination

### Cursor-Based (Preferred)
- Use `cursor` parameter for efficient pagination
- Returns `cursor` in response for next page
- Better performance for large datasets

### Offset-Based (Fallback)
- Use `page` and `per_page` parameters
- Suitable for smaller datasets
- Max `per_page`: 50

---

## Webhooks & Real-time

Real-time updates are handled via Supabase Realtime (WebSocket connections directly from frontend to Supabase), not through this REST API.

---

## Geolocation Endpoints

### GET `/geolocation/detect`

Detect IP address and get geolocation info (used during onboarding).

**Headers:**
```
Authorization: Bearer <token> (optional - for authenticated users)
```

**Response:** `200 OK`
```json
{
  "data": {
    "ip_address": "192.168.1.1", // Note: Only returned if authenticated admin
    "country": "United States",
    "country_code": "US",
    "region": "California",
    "city": "San Francisco",
    "timezone": "America/Los_Angeles",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Error Responses:**
- `503 SERVICE_UNAVAILABLE` - Geolocation service unavailable

**Note:** IP address is hashed before storage. Only full IP returned for authenticated admin users.

---

### POST `/users/me/onboarding`

Complete user onboarding with IP/timezone detection.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Trader and investor",
  "date_of_birth": "1990-01-01",
  "interests": ["Stocks", "Crypto"],
  "timezone": "America/New_York" // Browser-detected timezone from frontend
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "timezone": "America/New_York",
    "country": "United States",
    "country_code": "US",
    "created_at": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `409 CONFLICT` - Username already taken
- `422 VALIDATION_ERROR` - Invalid input

**Implementation Notes:**
- Backend extracts IP from request headers
- Calls geolocation API to get country
- Uses browser-detected timezone (preferred) or IP-based timezone
- Stores hashed IP address for privacy

---

## Admin Metrics Endpoints

**Note:** All metrics endpoints require admin authentication.

### GET `/metrics/dashboard`

Get all key metrics in one response (for admin dashboard).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date_from` (date, optional) - Start date for metrics
- `date_to` (date, optional) - End date for metrics

**Response:** `200 OK`
```json
{
  "data": {
    "user_metrics": {
      "dau": 1250,
      "mau": 8500,
      "new_signups_today": 45,
      "new_signups_this_week": 320,
      "new_signups_this_month": 1250,
      "retention_day_1": 0.65,
      "retention_day_7": 0.42,
      "retention_day_30": 0.28,
      "churn_rate": 0.05,
      "total_users": 12500,
      "active_users_today": 1250,
      "active_users_this_week": 5200,
      "active_users_this_month": 8500
    },
    "engagement_metrics": {
      "avg_posts_per_user": 3.2,
      "avg_comments_per_post": 2.5,
      "avg_reactions_per_post": 8.3,
      "avg_reposts_per_post": 1.2,
      "total_posts_today": 850,
      "total_posts_this_week": 5600,
      "total_posts_this_month": 22000,
      "total_reactions_today": 5200,
      "total_comments_today": 2100,
      "posts_with_media_percentage": 0.35,
      "posts_with_polls_percentage": 0.12
    },
    "growth_metrics": {
      "user_growth_week_over_week": 0.15,
      "user_growth_month_over_month": 0.42,
      "content_creation_growth_week": 0.28,
      "content_creation_growth_month": 0.65,
      "engagement_growth_week": 0.18,
      "engagement_growth_month": 0.52
    },
    "product_metrics": {
      "trending_tickers": [
        {
          "symbol": "AAPL",
          "mentions": 450,
          "mentions_24h": 125
        },
        {
          "symbol": "BTC",
          "mentions": 380,
          "mentions_24h": 98
        }
      ],
      "onboarding_completion_rate": 0.85,
      "most_active_users": [
        {
          "username": "johndoe",
          "posts_count": 145,
          "engagement_score": 2340
        }
      ]
    },
    "platform_health": {
      "api_response_time_avg_ms": 125,
      "api_error_rate": 0.002,
      "database_query_time_avg_ms": 45,
      "storage_usage_mb": 1250,
      "api_requests_today": 125000
    },
    "geographic_distribution": [
      {
        "country": "United States",
        "country_code": "US",
        "user_count": 6200,
        "percentage": 0.496
      },
      {
        "country": "United Kingdom",
        "country_code": "GB",
        "user_count": 1250,
        "percentage": 0.10
      }
    ],
    "timestamp": "2026-01-16T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `403 PERMISSION_DENIED` - Admin access required

---

### GET `/metrics/users`

Get user metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string, optional) - `day`, `week`, `month` (default: `day`)
- `date_from` (date, optional)
- `date_to` (date, optional)

**Response:** `200 OK`
```json
{
  "data": {
    "dau": 1250,
    "mau": 8500,
    "new_signups": {
      "today": 45,
      "this_week": 320,
      "this_month": 1250
    },
    "retention": {
      "day_1": 0.65,
      "day_7": 0.42,
      "day_30": 0.28
    },
    "churn_rate": 0.05,
    "total_users": 12500,
    "active_users": {
      "today": 1250,
      "this_week": 5200,
      "this_month": 8500
    }
  }
}
```

---

### GET `/metrics/engagement`

Get engagement metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string, optional) - `day`, `week`, `month`

**Response:** `200 OK`
```json
{
  "data": {
    "avg_posts_per_user": 3.2,
    "avg_comments_per_post": 2.5,
    "avg_reactions_per_post": 8.3,
    "avg_reposts_per_post": 1.2,
    "total_posts": {
      "today": 850,
      "this_week": 5600,
      "this_month": 22000
    },
    "total_reactions": {
      "today": 5200,
      "this_week": 35000,
      "this_month": 145000
    },
    "total_comments": {
      "today": 2100,
      "this_week": 14000,
      "this_month": 55000
    },
    "content_types": {
      "posts_with_media_percentage": 0.35,
      "posts_with_polls_percentage": 0.12,
      "posts_with_gifs_percentage": 0.08
    }
  }
}
```

---

### GET `/metrics/growth`

Get growth metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "user_growth": {
      "week_over_week": 0.15,
      "month_over_month": 0.42
    },
    "content_growth": {
      "week_over_week": 0.28,
      "month_over_month": 0.65
    },
    "engagement_growth": {
      "week_over_week": 0.18,
      "month_over_month": 0.52
    },
    "viral_coefficient": 1.25
  }
}
```

---

### GET `/metrics/health`

Get platform health metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "api": {
      "response_time_avg_ms": 125,
      "response_time_p95_ms": 250,
      "response_time_p99_ms": 500,
      "error_rate": 0.002,
      "requests_today": 125000,
      "requests_per_minute": 87
    },
    "database": {
      "query_time_avg_ms": 45,
      "query_time_p95_ms": 120,
      "slow_queries_count": 5,
      "connection_pool_usage": 0.65
    },
    "storage": {
      "usage_mb": 1250,
      "usage_percentage": 0.25,
      "files_count": 15420
    },
    "errors": {
      "total_today": 25,
      "critical_today": 2,
      "resolved_today": 20
    }
  }
}
```

---

### GET `/metrics/trending`

Get trending content metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (integer, optional, default: 10) - Number of trending items

**Response:** `200 OK`
```json
{
  "data": {
    "trending_tickers": [
      {
        "symbol": "AAPL",
        "mentions": 450,
        "mentions_24h": 125,
        "growth": 0.35
      }
    ],
    "trending_posts": [
      {
        "id": "uuid",
        "author": "johndoe",
        "content": "Great analysis...",
        "engagement_score": 2340,
        "reactions": 125,
        "comments": 45
      }
    ],
    "most_active_users": [
      {
        "username": "johndoe",
        "posts_count": 145,
        "engagement_score": 2340
      }
    ]
  }
}
```

---

### GET `/metrics/export`

Export metrics data (CSV/JSON format).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `format` (string, optional) - `json` (default) or `csv`
- `metric_type` (string, optional) - `users`, `engagement`, `growth`, `all`
- `date_from` (date, optional)
- `date_to` (date, optional)

**Response:** `200 OK`
- **Content-Type:** `application/json` or `text/csv`
- **Body:** Metrics data in requested format

**Error Responses:**
- `401 AUTH_REQUIRED` - Authentication required
- `403 PERMISSION_DENIED` - Admin access required
- `422 VALIDATION_ERROR` - Invalid format or date range

---

## Error Tracking Endpoints

### POST `/errors/log`

Log frontend errors (called from frontend error boundary).

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "error_type": "frontend",
  "error_code": "COMPONENT_ERROR",
  "error_message": "Failed to render component",
  "stack_trace": "Error: ...",
  "user_id": "uuid", // Optional
  "page_url": "/home",
  "user_agent": "Mozilla/5.0...",
  "severity": "error",
  "metadata": {
    "component": "Feed",
    "props": {}
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "error_id": "uuid",
    "logged_at": "2026-01-16T10:00:00Z"
  }
}
```

**Note:** This endpoint does not require authentication (errors should be logged even for unauthenticated users).

---

### GET `/errors`

Get error logs (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `severity` (string, optional) - Filter by severity
- `error_type` (string, optional) - Filter by error type
- `resolved` (boolean, optional) - Filter by resolved status
- `date_from` (date, optional)
- `date_to` (date, optional)
- `page` (integer, optional, default: 1)
- `per_page` (integer, optional, default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "error_type": "frontend",
      "error_code": "COMPONENT_ERROR",
      "error_message": "Failed to render component",
      "severity": "error",
      "user_id": "uuid",
      "page_url": "/home",
      "resolved": false,
      "created_at": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

---

### PATCH `/errors/{error_id}/resolve`

Mark error as resolved (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `error_id` (UUID, required) - Error log ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "resolved": true,
    "resolved_at": "2026-01-16T10:00:00Z"
  }
}
```

---

## Changelog

### Version 1.0.0 (2026-01-16)
- Initial API release
- All core endpoints implemented
- JWT authentication
- Pagination support
- IP geolocation and timezone detection
- Admin metrics endpoints
- Error tracking endpoints

---

**Document Status:** ✅ Complete  
**API Version:** 1.0.0  
**Last Updated:** January 2026
