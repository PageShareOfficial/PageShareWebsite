import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def _get_origins() -> List[str]:
    """
    Resolve allowed CORS origins from environment.

    - CORS_ORIGINS: comma-separated list of origins (no spaces, no trailing slash).
    - We use allow_credentials=True, so '*' is invalid per CORS; always use explicit origins.
    - Set CORS_ORIGINS in every environment (e.g. dev: http://localhost:3000 or your dev frontend URL).
    """
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return []
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    # With credentials, browser rejects '*'; ignore it so we don't send invalid headers
    return [o for o in origins if o != "*"]

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
