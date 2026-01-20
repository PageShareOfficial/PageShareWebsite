FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (add more here if needed, e.g. build tools or libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# - if requirements.txt exists, install from it
# - always ensure uvicorn is installed so the CMD works
COPY requirements.txt /app/requirements.txt
RUN if [ -f /app/requirements.txt ]; then \
      pip install --no-cache-dir -r /app/requirements.txt; \
    fi && \
    pip install --no-cache-dir "uvicorn[standard]"

# Copy the backend code
COPY . /app

# Default command for local development:
# - expects a FastAPI app at app.main:app
# - served with uvicorn on port 8000
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

