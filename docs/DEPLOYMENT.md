# Deployment

> **Author:** Abdulaziz AlAmawi · Smart Home AI Platform

> **Validation status:** The full stack was validated end-to-end against a **real
> PostgreSQL 18 database** with the backend running in `NODE_ENV=production` and the AI
> engine live. Prisma migrations applied cleanly, seeding succeeded (2 users, 8 devices,
> 1,983 telemetry rows) and **24/24** API smoke tests passed (auth, RBAC, CRUD, energy
> analytics, and AI prediction/recommendations through the backend). See
> [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md).

## Prerequisites

- Docker + Docker Compose (recommended), **or**
- Node.js 22, Python 3.12, PostgreSQL 16 for manual deployment.

## 1. Environment

Copy the root example and set strong secrets:

```bash
cp .env.example .env
```

Generate JWT secrets:

```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `AI_ENGINE_URL` | Internal URL of the AI service |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `NEXT_PUBLIC_API_URL` | Public API URL for the frontend |

## 2. Docker Compose (full stack)

```bash
docker compose up --build -d
```

This starts PostgreSQL, the AI engine (models pre-trained at build time), the backend
(runs `prisma migrate deploy` on boot) and the frontend.

Seed demo data (optional):

```bash
docker compose exec backend npx prisma db seed
```

Verify:

```bash
curl http://localhost:4010/api/v1/health
curl http://localhost:8010/health
```

## 3. Manual deployment

### AI Engine
```bash
cd ai-engine
pip install -r requirements.txt
python -m training.train
uvicorn app.main:app --host 0.0.0.0 --port 8010
```

### Backend
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
node dist/server.js
```

### Frontend
```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 npm run build
npm run start    # or run the standalone server.js
```

## 4. Production checklist

- [ ] Replace all default secrets in `.env`.
- [ ] Set `NODE_ENV=production`.
- [ ] Restrict `CORS_ORIGIN` to your real domain(s).
- [ ] Terminate TLS at a reverse proxy (nginx / Traefik / cloud LB).
- [ ] Configure database backups and connection pooling.
- [ ] Set up log aggregation and uptime monitoring on `/api/v1/health`.
- [ ] Run `docker compose exec backend npx prisma migrate deploy` on each release.

## 5. Platform deployment

### Option A — Vercel (frontend) + Railway (backend, AI engine, Postgres)

This is the recommended low-friction setup.

**Railway (backend + AI engine + database):**

1. Create a new Railway project and add the **PostgreSQL** plugin.
2. Add a service from the repo, root directory `ai-engine/` — Railway reads
   [`ai-engine/railway.json`](../ai-engine/railway.json) and builds the Dockerfile.
   Set env: `MODEL_DIR=/app/models`. Note the generated internal URL.
3. Add a service from the repo, root directory `backend/` — reads
   [`backend/railway.json`](../backend/railway.json). Set env:
   - `DATABASE_URL` → reference the Postgres plugin variable
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (use `openssl rand -hex 32`)
   - `AI_ENGINE_URL` → the AI engine internal URL
   - `CORS_ORIGIN` → your Vercel domain
   - `NODE_ENV=production`
   The backend runs `prisma migrate deploy` automatically on each deploy.
4. (Once) seed: `railway run --service backend npx prisma db seed`.

**Vercel (frontend):**

1. Import the repo, set **Root Directory** to `frontend/`.
   [`frontend/vercel.json`](../frontend/vercel.json) configures the Next.js build.
2. Add env var `NEXT_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1`.
3. Deploy. Vercel auto-builds on every push to the default branch.

### Option B — All on Railway

Add a third service for `frontend/` (reads [`frontend/railway.json`](../frontend/railway.json))
and set `NEXT_PUBLIC_API_URL` to the backend's public URL.

### Option C — Single host (Docker Compose)

Use `docker compose up --build -d` on any VM (see section 2) behind a TLS reverse proxy.

## 6. CI/CD

`.github/workflows/ci.yml` runs on every push/PR:

1. **ai-engine** — install + `pytest`
2. **backend** — install + `prisma generate` + typecheck + `jest`
3. **frontend** — install + typecheck + `next build`
4. **docker** — builds all three images (after the above pass)

Extend the `docker` job with a registry push + deploy step for your target
(e.g. AWS ECS, Fly.io, Render, Kubernetes).

## 7. Scaling

- Backend and frontend are stateless → scale horizontally behind a load balancer.
- The AI engine scales independently; model artifacts ship inside the image.
- Use a managed PostgreSQL with read replicas for heavy analytics workloads.
```
