FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8 /uv /uvx /bin/

# No .pyc files / unbuffered logs; uv copies files (no hardlinks across layers) and
# precompiles bytecode once at build time for faster cold starts.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# System deps (add more here if needed, e.g. build tools or libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (cached layer): only re-runs when the lock file changes.
COPY pyproject.toml uv.lock .python-version /app/
RUN uv sync --frozen --no-dev

COPY . /app

ENV PATH="/app/.venv/bin:$PATH"

# Default command: FastAPI app at app.main:app, served by uvicorn on port 8000
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
