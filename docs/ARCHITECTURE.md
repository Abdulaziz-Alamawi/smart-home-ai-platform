# Architecture

> **Author:** Abdulaziz AlAmawi · Smart Home AI Platform

## Overview

The Smart Home AI Platform is a four-tier system built with **clean architecture**
principles. Each tier is independently deployable and communicates over well-defined
HTTP/JSON contracts.

```
┌──────────────────────────────────────────────────────────────────┐
│                          Presentation                              │
│   Next.js 14 App Router · Tailwind · Recharts · Auth context       │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ REST (JSON, Bearer JWT)
┌───────────────────────────────▼──────────────────────────────────┐
│                          Application / API                        │
│  Express + TypeScript                                              │
│  Routes → Controllers → Services → Prisma                         │
│  Middleware: auth, rbac, validation (Zod), audit, error, rate-limit│
└──────────────┬───────────────────────────────┬───────────────────┘
               │ Prisma ORM                     │ REST (JSON)
┌──────────────▼─────────────┐   ┌──────────────▼───────────────────┐
│        Persistence          │   │            AI Engine             │
│  PostgreSQL 16              │   │  FastAPI + scikit-learn          │
│  13 entities, migrations    │   │  6 ML modules, joblib artifacts  │
└─────────────────────────────┘   └──────────────────────────────────┘
```

## Layers

### 1. Presentation (frontend/)
- **Next.js App Router** with a route group `(app)` that wraps authenticated pages in a
  shared `DashboardShell` (sidebar + topbar + auth guard).
- A typed **API client** (`lib/api.ts`) handles bearer tokens and transparent
  refresh-token rotation on `401`.
- **AuthProvider** (React context) exposes `login`, `register`, `logout`, and the current user.

### 2. Application / API (backend/)
Clean separation per module:

```
modules/<name>/
  <name>.routes.ts      # HTTP routing + OpenAPI annotations
  <name>.controller.ts  # request/response orchestration (thin)
  <name>.service.ts     # business logic (Prisma access)
  <name>.schema.ts      # Zod validation schemas
```

Cross-cutting concerns live in `middleware/` (auth, rbac, validate, audit, error) and
`lib/` (prisma, logger, aiClient, swagger).

### 3. Persistence (PostgreSQL + Prisma)
- Prisma schema is the single source of truth; migrations are generated from it.
- Every domain entity is scoped by `userId` for multi-tenant isolation.

### 4. AI Engine (ai-engine/)
- A standalone FastAPI microservice exposing prediction/analysis endpoints.
- Models are trained on a coherent **synthetic physical world** (daily/weekly/annual
  seasonality, temperature, occupancy, device catalogue) and persisted with joblib.
- A `ModelRegistry` loads artifacts at startup or trains them on first boot.

## Request lifecycle (example: AI recommendations)

1. User clicks **Generate insights** in the frontend.
2. Frontend `POST /api/v1/recommendations/generate` with a bearer token.
3. Backend authenticates (JWT) → authorises → builds a 24-hour load profile from the
   user's recent `EnergyUsage` rows.
4. Backend calls the AI engine `POST /ai/recommendations`.
5. AI engine runs cost optimisation + usage clustering + anomaly scoring and returns
   prioritised recommendations.
6. Backend persists them as `Recommendation` rows, emits high-priority `Notification`s,
   writes an `AuditLog`, and returns the result.
7. Frontend renders the prioritised cards.

## Security architecture

- **Authentication**: short-lived access JWT (15m) + rotating refresh token (7d) stored
  server-side in `RefreshToken` (revocable).
- **Authorization**: `authorize(...roles)` middleware enforces RBAC.
- **Password security**: bcrypt with 12 salt rounds.
- **Input validation**: Zod schemas on every mutating endpoint.
- **Hardening**: Helmet headers, CORS allow-list, per-IP rate limiting.
- **Auditability**: `AuditLog` records actor, action, resource, IP and user-agent.

## Scalability notes

- Stateless API → horizontally scalable behind a load balancer.
- AI engine is independently scalable; model artifacts are baked into the image at build.
- Database indices on all foreign keys + common query paths (status, time series).
