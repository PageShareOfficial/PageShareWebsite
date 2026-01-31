# PageShare Backend

[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)

RESTful API backend for **PageShare**—a social platform for financial markets discussions. Built with FastAPI, designed for deployment as serverless functions on Vercel, with PostgreSQL (Supabase) as the primary data store.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Migrations](#database-migrations)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## Overview

PageShare Backend is a FastAPI application that powers the social features of PageShare: user profiles, posts with ticker mentions ($AAPL, $TSLA), comments, reactions, reposts, bookmarks, polls, content moderation, and more. It integrates with **Supabase** for authentication (JWT), PostgreSQL database, and storage. The API is versioned at `/api/v1` and follows REST conventions with consistent error handling and pagination.

---

## Features

| Domain | Capabilities |
|--------|--------------|
| **Auth** | JWT verification (Supabase), session management |
| **Users** | Profile CRUD, onboarding, profile pictures |
| **Posts** | Create, edit, delete; ticker extraction; reposts (normal & quote) |
| **Comments** | Nested comments, replies |
| **Engagement** | Reactions (likes), bookmarks, polls with voting |
| **Social** | Follow/unfollow, feed (home & for-you) |
| **Content** | Search (users, posts, tickers); mute/block; reports |
| **Media** | Image upload (Supabase Storage), validation |
| **Finance** | Tickers, watchlists, news (GNews API) |
| **Admin** | Metrics, error logging, cron jobs |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Python 3.12 |
| **Framework** | FastAPI 0.115 |
| **ASGI Server** | Uvicorn |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | PostgreSQL (Supabase) |
| **Migrations** | Alembic |
| **Auth** | Supabase Auth (JWT) |
| **Storage** | Supabase Storage |
| **Validation** | Pydantic v2 |
| **Error Tracking** | Sentry (optional) |
| **Container** | Docker (local parity) |

---

## Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │  (Hostinger – Static Export)
└──────────┬──────────┘
           │ HTTP/HTTPS
           │ Authorization: Bearer <JWT>
           ▼
┌─────────────────────┐
│   FastAPI Backend   │  (Vercel Serverless Functions)
└──────────┬──────────┘
           │
           ├── SQLAlchemy → Supabase PostgreSQL
           ├── Supabase Client → Storage, Auth
           └── External APIs → GNews, IP Geolocation
```

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, middleware, route registration
│   ├── config.py            # Environment-based configuration
│   ├── database.py          # SQLAlchemy engine, sessions, health check
│   │
│   ├── api/                 # Route handlers (REST endpoints)
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   ├── comments.py
│   │   ├── reactions.py
│   │   ├── reposts.py
│   │   ├── tickers.py
│   │   ├── follows.py
│   │   ├── bookmarks.py
│   │   ├── content_filters.py
│   │   ├── reports.py
│   │   ├── polls.py
│   │   ├── search.py
│   │   ├── feed.py
│   │   ├── media.py
│   │   ├── watchlist.py
│   │   ├── news.py
│   │   ├── errors.py
│   │   ├── metrics.py
│   │   └── cron.py
│   │
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic layer
│   ├── middleware/          # CORS, error handling, logging, activity
│   └── utils/               # Helpers (ticker extraction, media validation)
│
├── alembic/                 # Database migrations
├── docs/                    # Architecture, schema, API, deployment
├── requirements.txt
├── Dockerfile
├── alembic.ini
└── .env.example
```

---

## Prerequisites

- **Python 3.12**
- **PostgreSQL** (or Supabase project)
- **Docker** (optional, for containerized runs)

---

## Getting Started

### 1. Clone and enter backend

```bash
cd backend
```

### 2. Create virtual environment

```bash
python -m venv venv
```

**Activate it:**

- Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
- Windows (CMD): `.\venv\Scripts\activate.bat`
- macOS/Linux: `source venv/bin/activate`

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials and other vars
```

### 5. Run locally

```bash
uvicorn app.main:app --reload
```

**Endpoints:**

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Root |
| `http://localhost:8000/health` | App health |
| `http://localhost:8000/health/db` | Database health |
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |

---

### Running with Docker

```bash
docker build -t pageshare-backend .
docker run -p 8000:8000 --env-file .env pageshare-backend
```

> **Note:** The Docker image is for local development and environment parity. Production uses Vercel serverless and does not rely on this image.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_ENV` | No | `dev` or `prod` (default: `dev`) |
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string (Supabase transaction pooler) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Yes (prod) | JWT secret for token verification |
| `SUPABASE_STORAGE_BUCKET` | No | Profile pictures bucket (default: `profile-pictures`) |
| `SUPABASE_MEDIA_BUCKET` | No | Post media bucket (default: `post-media`) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `SENTRY_ENVIRONMENT` | No | Sentry environment tag |
| `CRON_SECRET` | No | Secret for cron job endpoints |
| `GNEWS_API_KEY` | No | GNews API key (100 req/day free tier) |

Copy `.env.example` to `.env` and fill in the values.

---

## API Documentation

- **Interactive docs (Swagger):** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Written docs:** [`docs/03_API_DOCUMENTATION.md`](docs/03_API_DOCUMENTATION.md)

**Base path:** `/api/v1`  
**Auth:** `Authorization: Bearer <JWT>`

**Main resource groups:**

- `/auth` – Token verification
- `/users` – User profiles
- `/posts` – Posts CRUD
- `/comments` – Comments
- `/reactions` – Likes
- `/reposts` – Reposts
- `/tickers` – Ticker symbols
- `/follows` – Follow relationships
- `/bookmarks` – Bookmarks
- `/feed` – Home feed
- `/search` – Unified search
- `/media` – Uploads

---

## Database Migrations

Migrations are managed with **Alembic**.

**Create a migration:**

```bash
alembic revision --autogenerate -m "description"
```

**Apply migrations:**

```bash
alembic upgrade head
```

**Downgrade one revision:**

```bash
alembic downgrade -1
```

`DATABASE_URL` in `.env` must point to your target database.

---

## Development

### Adding a new package

```bash
pip install <package>
pip freeze > requirements.txt
```

### Code organization

- **API routes** → `app/api/` (thin layer, validation, dependencies)
- **Business logic** → `app/services/`
- **Data models** → `app/models/`
- **Request/response schemas** → `app/schemas/`

### Middleware

- **CORS** – Configurable origins
- **Error handling** – Centralized exception handlers
- **Request logging** – Request/response logging
- **Activity tracking** – User activity for analytics

---

## Deployment

Production deployment targets **Vercel Serverless Functions**:

1. Configure entrypoints and routes in `vercel.json`
2. Set all required environment variables in the Vercel dashboard
3. Run Alembic migrations against the production database before/after deploys

Details are in [`docs/04_PHASE_WISE_IMPLEMENTATION_PLAN.md`](docs/04_PHASE_WISE_IMPLEMENTATION_PLAN.md) (Phase 12).

---

## Documentation

| Document | Description |
|----------|-------------|
| [01_ARCHITECTURE_AND_MODULES.md](docs/01_ARCHITECTURE_AND_MODULES.md) | Architecture, module layout, responsibilities |
| [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) | Tables, relationships, indexes |
| [03_API_DOCUMENTATION.md](docs/03_API_DOCUMENTATION.md) | Endpoints, request/response formats, error codes |
| [04_PHASE_WISE_IMPLEMENTATION_PLAN.md](docs/04_PHASE_WISE_IMPLEMENTATION_PLAN.md) | Implementation phases, deployment |
| [05_VIEW_REFRESH.md](docs/05_VIEW_REFRESH.md) | Materialized views, refresh logic |

---
