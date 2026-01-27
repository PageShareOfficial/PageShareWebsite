from fastapi import FastAPI

from .config import get_settings
from .database import db_health_check

settings = get_settings()

app = FastAPI(title="PageShare Backend", version="0.1.0")


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

