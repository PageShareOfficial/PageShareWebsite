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


settings = get_settings()

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
