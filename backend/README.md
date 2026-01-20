## PageShare Backend

Backend for the PageShare project, built with **FastAPI** and designed to run both locally (with `venv`) and in Docker. This service will later be deployed as **serverless functions on Vercel**.

---

### Tech Stack

- **Language**: Python 3.12
- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Container**: Docker (for local parity across dev machines)

---

### Project Layout (backend)

- `app/`
  - `main.py` – FastAPI entrypoint (`app = FastAPI(...)`)
- `requirements.txt` – Python dependencies
- `Dockerfile` – Local Docker image for the backend
- `docs/` – Architecture, DB schema, API docs, and phase-wise plan

---

### Local Development (without Docker)

From the `backend/` directory:

```bash
python -m venv venv
source venv/bin/activate   # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn app.main:app --reload
```

App will be available at:

- `http://localhost:8000/` – root route
- `http://localhost:8000/health` – health check
- `http://localhost:8000/docs` – interactive API docs (Swagger UI)

---

### Local Development with Docker

From the `backend/` directory:

```bash
docker build -t pageshare-backend .
docker run -p 8000:8000 pageshare-backend
```

Then open:

- `http://localhost:8000/`
- `http://localhost:8000/health`
- `http://localhost:8000/docs`

This Docker image is mainly for **local dev + teammate parity** (Windows/Mac). Vercel serverless deployment will not use this Dockerfile directly.

---

### Dependencies

Defined in `requirements.txt`:

- `fastapi` – web framework
- `uvicorn[standard]` – ASGI server

For new packages:

```bash
pip install some-package
pip freeze > requirements.txt
```

---

### Deployment (High Level)

Backend will be deployed as **Vercel serverless functions**:

- Configure entrypoints and routes via `vercel.json` (in a later phase)
- Set all required env vars in Vercel dashboard
- Run DB migrations (Alembic) against Supabase before/after deploys

The detailed deployment steps are documented in `docs/04_PHASE_WISE_IMPLEMENTATION_PLAN.md` (Phase 12: Deployment & Production Setup).

