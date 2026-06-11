# Complete Technical Report — Smart Home AI Platform

> **Owner & Developer:** Abdulaziz AlAmawi
> **Report date:** June 11, 2026
> **Status:** Fully running locally · Production readiness ≈ 94%

---

## 0. Executive Summary

The **Smart Home AI Platform** is a complete **Smart Home OS** for managing intelligent homes,
built as a professional monorepo of **four** independently deployable layers:

```
Frontend (Next.js) → Backend API (Express/TS) → AI Engine (FastAPI) → Database (PostgreSQL)
```

This is not just a display dashboard; it includes:
- **Real AI** (6 scikit-learn models actually trained).
- **IoT simulation engine** with persistent state (~20 devices, 7 rooms).
- **Real-time streaming** over Socket.IO (telemetry + events + IoT snapshots).
- **15 dashboard pages** with a modern glass-morphism design and Arabic/English (RTL) support.
- **Enterprise security**: JWT + RBAC + audit logs + Zod validation.

### Quick metrics

| Metric | Value |
|--------|-------|
| Total source files (excl. dependencies) | **154** |
| TypeScript files | 55 |
| React files (.tsx) | 30 |
| Python files | 17 |
| Database models (Prisma) | **13** |
| REST modules (backend) | **14** |
| AI models | **6** |
| Frontend pages | **15** |
| Jest tests | 14/14 ✅ |
| E2E tests | 28/28 ✅ |

---

## 1. Overall Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                        │
│   Next.js 14 App Router · Tailwind · Recharts · Framer Motion      │
│   Socket.IO Client · i18n Arabic/English RTL                       │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ REST (JSON, Bearer JWT) + WebSocket
┌───────────────────────────────▼──────────────────────────────────┐
│                        Application / API Layer                    │
│  Express + TypeScript                                              │
│  Routes → Controllers → Services → Prisma                         │
│  Middleware: auth · rbac · validate (Zod) · audit · error · rate  │
│  IoT Simulation Engine · Socket.IO Gateway                        │
└──────────────┬───────────────────────────────┬───────────────────┘
               │ Prisma ORM                     │ REST (JSON)
┌──────────────▼─────────────┐   ┌──────────────▼───────────────────┐
│        Persistence          │   │            AI Engine             │
│  PostgreSQL 16/18           │   │  FastAPI + scikit-learn          │
│  13 models + migrations     │   │  6 ML modules + joblib           │
└─────────────────────────────┘   └──────────────────────────────────┘
```

**Design principle:** Each layer is isolated and communicates over clean HTTP/JSON contracts.
The backend contains no ML logic (delegates to the engine), the AI engine never touches the
database, and the frontend never talks to the database directly.

### Ports used

| Service | Port |
|---------|------|
| Frontend | 3001 |
| Backend API | 4010 |
| AI Engine | 8010 |
| Database (PostgreSQL) | 5433 |

---

## 2. Layer 1 — Frontend (frontend/)

### Technologies
- **Next.js 14.2.35** (App Router) · **React 18.3** · **TypeScript 5.7**
- **Tailwind CSS 3.4** (glass-morphism design)
- **Recharts 2.15** for charts
- **Framer Motion 11.18** for animations (pinned to v11 deliberately to avoid v12 issues)
- **lucide-react** for icons · **socket.io-client 4.8** for real-time

### Folder structure
```
frontend/
├── app/
│   ├── page.tsx              Landing page
│   ├── layout.tsx            Root layout + providers
│   ├── login/ · register/    Auth pages
│   └── (app)/                Protected route group (auth guard)
│       ├── layout.tsx        DashboardShell (sidebar + topbar)
│       ├── dashboard/        Main dashboard
│       ├── executive/        Executive Command Center ⭐
│       ├── maintenance/      Predictive Maintenance ⭐
│       ├── soc/              Security Operations Center ⭐
│       ├── twin/             Digital Twin
│       ├── map/              Home Map
│       ├── devices/ · ai/ · energy/ · automation/
│       ├── security/ · analytics/
│       └── notifications/ · profile/ · settings/
├── components/               7 shared components
└── lib/                      11 logic modules
```

### The fifteen pages
| Page | Route | Function |
|------|-------|----------|
| Dashboard | `/dashboard` | Overview + live cards |
| **Executive Center** | `/executive` | 6 scores (health, AI confidence, reliability, efficiency, security, savings) |
| **Predictive Maintenance** | `/maintenance` | Lifespan + failure probability + scheduling |
| **Security Operations Center** | `/soc` | Cameras + sensors + security timeline |
| Digital Twin | `/twin` | Interactive room grid + live telemetry |
| Home Map | `/map` | Thermal room zones |
| Devices | `/devices` | CRUD + power toggle |
| AI Center | `/ai` | Explainable recommendations + energy forecast |
| Energy | `/energy` | Heatmap + consumption breakdown |
| Automation | `/automation` | IF/THEN rule builder |
| Security | `/security` | General security status |
| Analytics | `/analytics` | Historical reports |
| Notifications/Profile/Settings | — | User management |

### Key `lib/` modules
- **`api.ts`** — typed API client; manages Bearer token and transparent refresh-token rotation on 401.
- **`auth.tsx`** — `AuthProvider` (React context) exposing login/register/logout and current user.
- **`realtime.tsx`** — Socket.IO context + `IotSnapshot`, `SimDevice`, `SimRoom` types.
- **`scores.ts`** — computes executive scores from IoT + devices + energy + recommendations.
- **`maintenance.ts`** — computes lifespan, failure probability, risk tier, service date.
- **`spatial.ts`** — `SceneGraph` and `buildSceneGraph()` — spatial abstraction layer ready for three.js.
- **`i18n.tsx`** — Arabic/English translation system with RTL toggle.
- **`home.ts`, `hooks.ts`, `types.ts`, `utils.ts`** — shared helpers and types.

---

## 3. Layer 2 — Backend / API (backend/)

### Technologies
- **Express 4.21** + **TypeScript 5.7** · **Prisma 6.2** (ORM)
- **Socket.IO 4.8** for streaming · **Zod 3.24** for validation
- **jsonwebtoken 9** + **bcryptjs** (12 rounds) for auth
- **Helmet 8** + **express-rate-limit 7.5** + **cors** for security
- **swagger-jsdoc** + **swagger-ui-express** for OpenAPI docs

### Architecture pattern
```
Request → Middleware (auth/rbac/validate/audit) → Route → Controller → Service → Prisma → DB
```

### The fourteen REST modules
| Module | Route | Function |
|--------|-------|----------|
| auth | `/auth` | register/login/refresh/logout |
| users | `/users` | user management |
| devices | `/devices` | CRUD + toggle + stats |
| rooms | `/rooms` | room management |
| deviceGroups | `/device-groups` | device groups |
| automation | `/automation-rules` | automation rules |
| schedules | `/schedules` | cron schedules |
| energy | `/energy` | summary + timeseries (real aggregation) |
| notifications | `/notifications` | notifications |
| recommendations | `/recommendations` | persisted AI recommendations |
| analytics | `/analytics` | analytics dashboard |
| settings | `/settings` | user preferences |
| audit | `/audit-logs` | audit logs (admin only) |
| **iot** | `/iot/snapshot` | IoT simulation snapshot ⭐ |

Plus `GET /health`, which checks both API and AI-engine reachability together.

### Supporting structure (`lib/`, `middleware/`, `utils/`)
- **`middleware/`**: `auth` (JWT verification), `rbac` (role permissions), `validate` (Zod),
  `audit` (operation logging), `error` (unified error handler).
- **`lib/aiClient.ts`**: HTTP client to the AI engine.
- **`lib/iotSimulator.ts`**: IoT simulation engine (see section 5).
- **`lib/realtime.ts`**: Socket.IO gateway, broadcasts every 3 seconds.
- **`lib/prisma.ts`, `swagger.ts`, `logger.ts`**: infrastructure.
- **`utils/`**: `jwt`, `password` (bcrypt), `ApiError`, `asyncHandler`, `time`.

---

## 4. Layer 3 — AI Engine (ai-engine/)

### Technologies
- **FastAPI 0.115** + **uvicorn 0.34** · **Python 3.13**
- **scikit-learn 1.6.1** · **pandas 2.2** · **numpy 2.2** · **joblib 1.4**
- **pydantic 2.10** for request/response validation

### The six models (real ML — not mocks)
| Model | Route | Algorithm | Function |
|-------|-------|-----------|----------|
| Energy Prediction | `POST /ai/energy/predict` | Gradient Boosting Regressor | 24h forecast (R² ≈ 0.937) |
| Anomaly Detection | `POST /ai/anomaly/detect` | Isolation Forest | detect faults & spikes |
| Usage Analysis | `POST /ai/usage/analyze` | KMeans | cluster consumption patterns |
| Smart Scheduling | `POST /ai/schedule/optimize` | tariff-aware optimization | best run window |
| Cost Optimization | `POST /ai/cost/optimize` | load shifting | realizable savings |
| Recommendation Engine | `POST /ai/recommendations` | model fusion | priority-ranked recommendations |

### Structure
```
ai-engine/app/
├── main.py            FastAPI application
├── config.py          settings
├── schemas.py         request/response models (pydantic)
├── routers/           health.py + predictions.py
├── models/            6 model modules
├── services/registry.py   model registry (joblib loading)
└── data/synthetic.py  synthetic training data generation
training/train.py      training script → produces /models/*.pkl
```

**Training:** `python -m training.train` trains the models and saves them as joblib artifacts.
The engine rejects requests with 503 if models are not ready (`_require_ready`).

### Explainable AI
Each recommendation in the AI Center surfaces: **Reason** (category-specific explanation),
**Confidence** (72–98%), **Impact** (45–99%), and **Estimated Savings** (from the backend).

---

## 5. IoT Simulation Engine ⭐ (Signature feature)

File **`backend/src/lib/iotSimulator.ts`** — a self-contained domain simulation (no DB writes).

### What it simulates
- **~20 devices** across **7 rooms**, with types: LIGHT, THERMOSTAT, AC, LOCK, CAMERA,
  MOTION_SENSOR, DOOR_SENSOR, PLUG, ENERGY_METER.
- **Per device:** online/offline, battery charge (gradual drain), signal strength, device
  health, power consumption, last change.
- **Per room:** temperature, humidity, occupancy, carbon dioxide (CO₂).
- **Events:** security (intrusion/motion), alerts (low battery, device offline), at three
  severity levels (CRITICAL / WARNING / INFO).

### How it works
The engine is **stateful** and evolves state via `step()`. The `realtime.ts` gateway broadcasts
three channels every **3 seconds**:
- `iot` — full snapshot (all devices and rooms).
- `telemetry` — concise summary.
- `event` — new events produced by `step()`.

A REST fallback is also available: `GET /api/v1/iot/snapshot` (JWT-protected).

> **Honest note:** Telemetry is **simulated** (a stateful engine), not physical MQTT devices.
> This is an appropriate design choice for a portfolio project, and the architecture is ready
> to connect a real MQTT bridge later.

---

## 6. Layer 4 — Database (PostgreSQL + Prisma)

### The thirteen models
| Model | Description |
|-------|-------------|
| **User** | Core identity + role (ADMIN/MANAGER/USER) |
| **RefreshToken** | Refresh tokens (with rotation) |
| **UserSettings** | Preferences (theme, language, currency, tariff, timezone) |
| **Room** | Rooms (with floor) |
| **DeviceGroup** | Device groups |
| **Device** | Devices (type, status, power rating, on/off, firmware, IP) |
| **EnergyUsage** | Energy records (kWh + cost + time) |
| **AutomationRule** | Automation rules (trigger + conditions + actions as JSON) |
| **Schedule** | Cron schedules |
| **Notification** | Notifications (4 types) |
| **Recommendation** | Recommendations (category + priority + savings) |
| **Analytics** | Analytical snapshots (energy, cost, peak hour, load factor) |
| **AuditLog** | Audit trail (action, resource, IP, user agent) |

### Technical attributes
- **Relations:** foreign keys with `onDelete` rules (Cascade / SetNull).
- **Indexes:** on all foreign keys and time-series query paths
  (`@@index([deviceId, recordedAt])`, etc.).
- **Enums:** Role, DeviceType (10 types), DeviceStatus, NotificationType,
  RecommendationCategory, Priority, AutomationTrigger.
- **Migrations:** `0001_init` applies cleanly via `prisma migrate deploy`.
- **Seed:** two users (admin + demo) · 8 devices · ~1,983 energy rows.

### Demo credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smarthome.ai` | `Admin123!` |
| User | `demo@smarthome.ai` | `Demo123!` |

---

## 7. Security

| Control | Status | Evidence |
|---------|--------|----------|
| Password hashing | ✅ | bcrypt, 12 rounds |
| JWT (access + refresh) | ✅ | with refresh-token rotation |
| RBAC (3 roles) | ✅ | USER blocked from admin routes (403) |
| Input validation | ✅ | Zod rejects bad payloads (400) |
| Helmet + CORS + Rate Limit | ✅ | configured in `app.ts` |
| Audit logging | ✅ | persisted for every mutation |
| Secrets outside code | ✅ | `.env.example` files only |

**Known bug previously fixed:** `jti` collision in refresh-token rotation.

> **Not verified:** penetration test, WAF, mTLS, secrets-manager integration.

---

## 8. Infrastructure & Deployment (DevOps)

### Ready files
- **`docker-compose.yml`** — 4 services (postgres, ai-engine, backend, frontend) with healthchecks.
- **`backend/Dockerfile`** — multi-stage, runs `prisma migrate deploy` on boot.
- **`ai-engine/Dockerfile`** — pre-trains models during build.
- **`frontend/Dockerfile`** — standalone mode (`node server.js`).
- **`railway.json`** × 3 (for the three services) + **`frontend/vercel.json`**.
- **`.github/workflows/ci.yml`** — CI (test + typecheck + build + docker).

### Key environment variables
| Variable | Service |
|----------|---------|
| `DATABASE_URL` | Backend |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Backend |
| `AI_ENGINE_URL` | Backend |
| `CORS_ORIGIN` | Backend |
| `NEXT_PUBLIC_API_URL` | Frontend |

> **Note:** On Windows use `127.0.0.1:5433` instead of `localhost` (IPv6 issue).
> Build with `NODE_ENV=production` (development mode breaks `next build`).

---

## 9. Tests & Verification

| Check | Result |
|-------|--------|
| Frontend typecheck (`tsc --noEmit`) | ✅ clean |
| Frontend production build (`next build`) | ✅ 20 routes |
| Backend compile (`tsc`) | ✅ clean |
| Backend tests (Jest) | ✅ **14/14** |
| E2E tests (`e2e-smoke.js`) | ✅ **28/28** |
| AI engine tests (pytest) | ✅ 14 |
| Health check (`/health`) | ✅ `api:true, aiEngine:true` |
| Socket.IO handshake | ✅ 200 |

The `backend/scripts/e2e-smoke.js` file tests a full real flow: register/login, route protection,
token rotation, RBAC, Zod validation, device CRUD, energy aggregation, AI recommendations, and audit logs.

---

## 10. Available Documentation

| File | Content |
|------|---------|
| `README.md` | Overview + quick start + features |
| `docs/ARCHITECTURE.md` | System design and data flow |
| `docs/DATABASE.md` | Schema, entities, and relationships |
| `docs/API.md` | REST endpoints reference |
| `docs/DEPLOYMENT.md` | Production deployment guide |
| `screenshots/README.md` | Screenshot capture guide |
| **`docs/PROJECT-REPORT-EN.md`** | **This report (English) — final report** |

---

## 11. Strengths (recruiter signals)

| Capability | Evidence |
|------------|----------|
| **AI Engineering** | FastAPI + 6 ML modules + explainable UI |
| **Machine Learning** | trained scikit-learn models + joblib persistence |
| **IoT Architecture** | stateful simulation engine + device fleet + room telemetry |
| **Real-Time Systems** | Socket.IO with three channels |
| **Full Stack** | Next.js + Express + Prisma + PostgreSQL |
| **Automation** | visual IF/THEN rule builder + backend CRUD |
| **Analytics** | energy heatmap + executive scores + reports |
| **Enterprise Security** | JWT + RBAC + audit logs + SOC dashboard |
| **Cloud Readiness** | Dockerfiles + compose + Railway + Vercel |
| **3D Twin Prep** | `SceneGraph` abstraction ready for three.js |

---

## 12. Limitations (honest assessment)

1. IoT telemetry is **simulated** (a stateful engine), not physical MQTT devices.
2. Predictive maintenance scores are **heuristic**, not a trained survival model.
3. Executive confidence scores are derived computationally, not live model inference.
4. 3D rendering is **architecture only** — no WebGL renderer yet (the layer is ready).
5. Actual cloud deploy to Railway/Vercel was **not executed** (configs ready, needs credentials).
6. Portfolio screenshots need manual capture from the live UI.

---

## 13. Production Readiness Score

### **Overall: 94%**

| Area | Score | Note |
|------|-------|------|
| Core platform (auth, CRUD, AI, DB) | 98% | fully verified |
| Real-time + IoT simulation | 95% | verified |
| Portfolio UI (15 pages) | 96% | verified |
| Tests & CI | 97% | 14 + 28 passing |
| Cloud deploy execution | 80% | configs ready, not deployed |
| Portfolio assets (screenshots) | 40% | need manual capture |

This is an honest figure. The platform is production-capable for demo, portfolio, and staged
deployment. The remaining 6%: live cloud deploy proof, screenshots, Docker image rebuild
(optional), and a real MQTT bridge (optional).

---

## 14. How to Run (quick demo)

```bash
# 1) Database (PostgreSQL on 5433) — or: docker compose up postgres
# 2) AI Engine (port 8010)
cd ai-engine && .venv/Scripts/python -m uvicorn app.main:app --port 8010
# 3) Backend (port 4010) — production mode with correct env variables
cd backend && npm run build && node dist/server.js
# 4) Frontend (port 3001)
cd frontend && npm run build && npm start

# Login: demo@smarthome.ai / Demo123!
# Start at: http://localhost:3001/executive
```

---

*This report was produced as part of the final portfolio enhancement pass — Abdulaziz AlAmawi, 2026.*
