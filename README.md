# Smart Home AI Platform

> **Author & Owner:** Abdulaziz AlAmawi — sole developer and copyright holder of the Smart Home AI Platform.

A **production-grade Smart Home OS** — AI, IoT simulation, real-time telemetry, digital twin,
executive analytics, predictive maintenance, and security operations in one portfolio-ready monorepo.

Built as a clean, enterprise-style monorepo:

```
Frontend (Next.js) → Backend API (Express/TS) → AI Engine (FastAPI/scikit-learn) → Database (PostgreSQL/Prisma)
```

[![CI](https://github.com/your-org/smart-home-ai-platform/actions/workflows/ci.yml/badge.svg)](./.github/workflows/ci.yml)

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Default credentials](#default-credentials)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Features

### AI Engine (real machine learning — no mocks)
- **Energy Consumption Prediction** — gradient-boosting regressor (R² ≈ 0.94 on validation).
- **Anomaly Detection** — IsolationForest flags faults, spikes and sensor dropouts.
- **Device Usage Analysis** — KMeans clustering of consumption regimes.
- **Smart Scheduling** — optimises deferrable loads against a time-of-use tariff.
- **Cost Optimization** — load-shifting optimisation with realisable savings.
- **Recommendation Engine** — fuses the modules into prioritised, actionable advice.

### Backend
- JWT authentication with refresh-token rotation.
- Role-Based Access Control (ADMIN / MANAGER / USER).
- 13 REST modules: auth, users, devices, rooms, device-groups, automation, schedules,
  energy, notifications, recommendations, analytics, settings, audit.
- Zod request validation, Helmet, rate limiting, CORS, structured logging.
- Auto-generated **Swagger/OpenAPI** docs.
- Full **audit logging** of mutating actions.

### Frontend — Smart Home OS (15 dashboard pages)
- **Executive Command Center** (`/executive`) — home health, AI confidence, reliability,
  efficiency, security, savings scores with live deltas.
- **Predictive Maintenance** (`/maintenance`) — remaining lifespan, failure probability,
  risk tiers, suggested service dates.
- **Security Operations Center** (`/soc`) — camera grid, door sensors, motion timeline.
- **Digital Twin** (`/twin`) + **Home Map** (`/map`) — interactive room grid with live telemetry.
- **AI Command Center** (`/ai`) — explainable recommendations, confidence, impact, savings.
- Energy, Automation, Devices, Analytics, Security, Settings, Profile, Notifications.
- **Socket.IO** live channels: `telemetry`, `iot`, `event`.
- **i18n** — Arabic/English with RTL layout toggle.
- Dark glass-morphism UI, Recharts, Framer Motion.

### IoT Simulation Engine
- Stateful fleet simulator (~20 devices, 7 rooms) in the backend.
- Evolves: online/offline, battery drain, signal, temperature, humidity, occupancy, CO₂, power.
- Broadcasts full snapshot every 3s via Socket.IO + `GET /api/v1/iot/snapshot`.

### Digital Twin 3D Prep
- `frontend/lib/spatial.ts` — `SceneGraph`, room/device anchors in meter space.
- Ready for three.js / React Three Fiber without UI rewrite.

### Database
- 13 Prisma models covering every required entity + SQL migrations.

### DevOps & Cloud Readiness
- Dockerfiles + `docker-compose.yml` for the whole stack.
- Railway configs (`railway.json`) for frontend, backend, AI engine.
- Vercel config (`vercel.json`) for frontend deploy.
- GitHub Actions CI (test + typecheck + build + docker).

### Portfolio assets
- Final project report: [docs/PROJECT-REPORT-EN.md](docs/PROJECT-REPORT-EN.md) — **94% production readiness**
- Screenshot guide: [screenshots/README.md](screenshots/README.md)

---

## Architecture

```
┌────────────┐     HTTPS     ┌────────────┐    REST     ┌────────────┐
│  Frontend  │ ────────────▶ │  Backend   │ ──────────▶ │ AI Engine  │
│  Next.js   │ ◀──────────── │ Express/TS │ ◀────────── │  FastAPI   │
└────────────┘    JSON       └─────┬──────┘   JSON      └────────────┘
                                   │ Prisma
                                   ▼
                            ┌────────────┐
                            │ PostgreSQL │
                            └────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts |
| Backend   | Node.js 22, Express, TypeScript, Prisma, Zod, JWT, Swagger |
| AI Engine | Python 3.12, FastAPI, scikit-learn, pandas, NumPy, joblib |
| Database  | PostgreSQL 16 |
| DevOps    | Docker, Docker Compose, GitHub Actions |

---

## Project structure

```
smart-home-ai-platform/
├── frontend/        # Next.js SaaS dashboard
├── backend/         # Express REST API + Prisma
├── ai-engine/       # FastAPI + scikit-learn microservice
├── docs/            # ARCHITECTURE, DATABASE, API, DEPLOYMENT
├── .github/workflows/ci.yml
└── docker-compose.yml
```

---

## Quick start (Docker)

> Requires Docker + Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

> **Ports** are chosen to run side-by-side with other local projects (e.g. StudentCareer
> on 3000/8000) without conflicts.

| Service    | URL |
|------------|-----|
| Frontend   | http://localhost:3001 |
| Backend    | http://localhost:4010 |
| API docs   | http://localhost:4010/api/docs |
| AI Engine  | http://localhost:8010/docs |
| PostgreSQL | localhost:5433 (host) |

The backend container runs `prisma migrate deploy` automatically on boot.
To seed demo data:

```bash
docker compose exec backend npx prisma db seed
```

---

## Local development

### 1. AI Engine
```bash
cd ai-engine
python -m venv .venv && .venv/Scripts/activate   # Windows
# source .venv/bin/activate                       # macOS/Linux
pip install -r requirements.txt
python -m training.train          # train + persist models
uvicorn app.main:app --reload --port 8010
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env               # set DATABASE_URL + JWT secrets
npx prisma migrate deploy          # or: npx prisma migrate dev
npx prisma db seed                 # demo data
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## Default credentials

After seeding:

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | `admin@smarthome.ai`    | `Admin123!`|
| User  | `demo@smarthome.ai`     | `Demo123!` |

---

## Testing

```bash
# AI engine (pytest)
cd ai-engine && pytest -q

# Backend (jest)
cd backend && npm test

# Frontend (typecheck + production build)
cd frontend && npm run typecheck && npm run build

# E2E production smoke (28 checks — requires all services running)
cd backend && node scripts/e2e-smoke.js
```

---

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design & data flow
- [DATABASE.md](docs/DATABASE.md) — schema, entities & relationships
- [API.md](docs/API.md) — REST endpoints reference
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — production deployment guide
- [PROJECT-REPORT-EN.md](docs/PROJECT-REPORT-EN.md) — full final project report

---

## Author

**Abdulaziz AlAmawi** — sole project owner, developer and copyright holder.

## License

MIT © 2026 Abdulaziz AlAmawi
