import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

def _get_origins() -> List[str]:
    """
    Resolve allowed CORS origins from environment.

    - CORS_ORIGINS: comma-separated list of origins
    - In dev, if not set, default to '*' for convenience.
    """
    settings = get_settings()
    raw = os.getenv("CORS_ORIGINS", "")
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
    elif settings.app_env == "dev":
        origins = ["*"]
    else:
        origins = []
    return origins

def init_cors(app: FastAPI) -> None:
    """
    Attach CORS middleware to the FastAPI app.
    """
    origins = _get_origins()
    if not origins:
        return

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
