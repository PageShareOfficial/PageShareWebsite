"""
Vercel serverless entrypoint. Exposes the FastAPI app so Vercel can run it.
See: https://vercel.com/docs/frameworks/backend/fastapi
"""
from app.main import app

__all__ = ["app"]
