# PageShare – Deploy dev build (Frontend + Backend)

Deploy **frontend** build to **Hostinger** and **backend** to **Vercel** (serverless, free tier).

---

## 1. Backend on Vercel (serverless)

### 1.1 What’s in the repo

- **`backend/index.py`** – Vercel entrypoint; exposes the FastAPI `app`.
- **`backend/vercel.json`** – Tells Vercel this is a FastAPI app and routes all requests to it.

### 1.2 Deploy backend

**Option A: Deploy only the backend folder (recommended)**

1. Install Vercel CLI: `npm i -g vercel`
2. From repo root:
   ```bash
   cd backend
   vercel
   ```
3. When prompted:
   - Link to existing project or create new (e.g. `pageshare-api`).
   - **Root Directory:** leave default (current dir = `backend`).
   - **Override settings:** no (use `vercel.json`).

**Option B: Deploy from Vercel Dashboard (Git)**

1. In [Vercel](https://vercel.com) → Add New → Project → Import your Git repo.
2. Set **Root Directory** to `backend` (not the repo root).
3. Leave Build / Output as default (Vercel detects FastAPI).
4. Deploy.

### 1.3 Backend environment variables (Vercel)

In Vercel: Project → Settings → Environment Variables. Add at least:

| Variable | Required | Notes |
|----------|----------|--------|
| `APP_ENV` | Yes | Set to `prod` |
| `DATABASE_URL` | Yes | Supabase pooler URL (transaction) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For admin operations |
| `SUPABASE_JWT_SECRET` | Yes | To verify Supabase JWTs |
| `SUPABASE_STORAGE_BUCKET` | Optional | Default `profile-pictures` |
| `SUPABASE_MEDIA_BUCKET` | Optional | Default `post-media` |
| `CRON_SECRET` | Optional | If you call cron endpoint |
| `GNEWS_API_KEY` | Optional | For news API (free tier) |
| `SENTRY_DSN` | Optional | For error tracking |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated frontend origins, e.g. `https://yourdomain.com,https://www.yourdomain.com` |

Redeploy after changing env vars.

### 1.4 Backend URL

After deploy you’ll get a URL like:

`https://pageshare-api-xxx.vercel.app`

Use this as the **API base URL** for the frontend (no trailing slash). Frontend will call:

`https://<your-vercel-backend>/api/v1/...`

---

## 2. Frontend on Hostinger

### 2.1 Build the frontend

From repo root:

```bash
cd frontend
npm ci
npm run build
```

Set the backend URL for the build (so the built app knows where the API is):

**Windows (PowerShell):**
```powershell
$env:NEXT_PUBLIC_API_URL="https://YOUR_VERCEL_BACKEND_URL"; npm run build
```

**Linux/macOS:**
```bash
NEXT_PUBLIC_API_URL=https://YOUR_VERCEL_BACKEND_URL npm run build
```

Replace `YOUR_VERCEL_BACKEND_URL` with your Vercel backend URL (e.g. `https://pageshare-api-xxx.vercel.app`).

### 2.2 Hostinger: two common setups

**A) Hostinger with Node.js**

If your Hostinger plan supports Node.js:

1. Upload the whole `frontend` folder (including `.next` and `node_modules`, or run `npm ci` and `npm run build` on the server if you have SSH).
2. Set env on the server: `NEXT_PUBLIC_API_URL=https://your-vercel-backend.vercel.app`
3. Start the app: `npm run start` (runs `next start`).
4. Point the domain to the process (e.g. via Node.js app settings in hPanel).

**B) Hostinger static / no Node (static export)**

If you only have static hosting (no Node), you must use a **static export**:

1. In `frontend/next.config.mjs` add:
   ```js
   const nextConfig = {
     output: 'export',
     // ... rest of your config
   };
   ```
2. Fix any dynamic features that break with static export (e.g. `useSearchParams` wrapped in `<Suspense>`, or client-only logic). Then:
   ```bash
   cd frontend
   NEXT_PUBLIC_API_URL=https://your-vercel-backend.vercel.app npm run build
   ```
3. Upload the contents of `frontend/out` to Hostinger’s `public_html` (or the folder your domain points to).

Static export limits: no server-side API routes, no ISR; all API calls go from the browser to your Vercel backend.

### 2.3 Frontend environment variables on Hostinger

- **With Node (next start):** set `NEXT_PUBLIC_API_URL` in the environment where you run `npm run start`.
- **With static export:** bake it into the build (as in 2.1) before uploading `out/`.

No other env vars are required for the frontend if auth and data go through your backend (Supabase keys can stay backend-only if you use your API for auth).

---

## 3. CORS (backend)

The backend reads **`CORS_ORIGINS`** (comma-separated). In prod it does not default to `*`, so you must set this in Vercel, e.g.:

```
https://yourdomain.com,https://www.yourdomain.com
```

Use your actual Hostinger frontend URL(s). Without this, browser requests from the frontend to the API will be blocked by CORS.

---

## 4. Quick checklist

- [ ] Backend: `backend/index.py` and `backend/vercel.json` in repo.
- [ ] Backend: Deploy `backend` to Vercel (CLI or Git with root = `backend`).
- [ ] Backend: All required env vars set in Vercel (especially `APP_ENV`, `DATABASE_URL`, Supabase keys, `SUPABASE_JWT_SECRET`).
- [ ] Frontend: Build with `NEXT_PUBLIC_API_URL=https://<vercel-backend-url>`.
- [ ] Frontend: Upload to Hostinger (Node app or static `out/`) and point domain.
- [ ] CORS: Backend allows your Hostinger frontend origin.

After that, the dev build of frontend (Hostinger) and backend (Vercel) will work together.

### 5. Supabase Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add your Hostinger frontend URL(s) to **Redirect URLs**, e.g.:

- `https://yourdomain.com/auth/callback`
- `https://www.yourdomain.com/auth/callback`

So sign-in redirects work after deployment.
