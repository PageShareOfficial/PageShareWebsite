from fastapi import FastAPI
from .config import get_settings
from .database import db_health_check
from .middleware.cors import init_cors
from .middleware.error_handler import init_error_handlers
from .middleware.logging import init_request_logging
from .api.auth import router as auth_router
from .api.users import router as users_router
from .api.posts import router as posts_router
from .api.comments import router as comments_router
from .api.reactions import router as reactions_router
from .api.reposts import router as reposts_router
from .api.tickers import router as tickers_router
from .api.follows import router as follows_router
from .api.bookmarks import router as bookmarks_router
from .api.content_filters import router as content_filters_router
from .api.reports import router as reports_router
from .api.polls import router as polls_router
from .api.search import router as search_router
from .api.feed import router as feed_router
from .api.media import router as media_router
from .api.errors import router as errors_router

settings = get_settings()
# Sentry: init only when DSN is set (optional)
if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.1,
    )

app = FastAPI(title="PageShare Backend", version="0.1.0")

# Global middleware / handlers
init_cors(app)
init_error_handlers(app)
init_request_logging(app)

@app.get("/health")
async def health_check():
    """
    Simple app-level health check.
    """
    return {"status": "ok", "env": settings.app_env}

@app.get("/health/db")
async def health_check_db():
    """
    Database connectivity health check.
    """
    ok = db_health_check()
    return {"database": "ok" if ok else "unreachable"}

@app.get("/")
async def root():
    return {"message": "PageShare Backend API"}

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(comments_router, prefix="/api/v1")
app.include_router(reactions_router, prefix="/api/v1")
app.include_router(reposts_router, prefix="/api/v1")
app.include_router(tickers_router, prefix="/api/v1")
app.include_router(follows_router, prefix="/api/v1")
app.include_router(bookmarks_router, prefix="/api/v1")
app.include_router(content_filters_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(polls_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(feed_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(errors_router, prefix="/api/v1")
