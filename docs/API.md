# API Reference

> **Author:** Abdulaziz AlAmawi · Smart Home AI Platform

Base URL: `/api/v1` · Interactive docs: `/api/docs` (Swagger UI) · Spec: `/api/docs.json`

All authenticated endpoints require an `Authorization: Bearer <accessToken>` header.
Responses use a consistent envelope:

```json
{ "success": true, "data": { ... } }
// or for lists
{ "success": true, "items": [ ... ], "total": 42, "page": 1, "pageSize": 20 }
// errors
{ "success": false, "error": { "message": "...", "details": [ ... ] } }
```

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | – | Register; returns user + tokens |
| POST | `/auth/login` | – | Login; returns user + tokens |
| POST | `/auth/refresh` | – | Rotate refresh token |
| POST | `/auth/logout` | – | Revoke a refresh token |
| GET  | `/auth/me` | ✓ | Current user + settings |

## Users

| Method | Path | Role | Description |
|--------|------|------|-------------|
| PATCH | `/users/profile` | any | Update own profile |
| GET | `/users` | ADMIN, MANAGER | List users |
| PATCH | `/users/:id` | ADMIN | Update role / active status |

## Devices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/devices` | List (filters: status, type, roomId; paginated) |
| GET | `/devices/stats` | Counts: total/online/offline/error |
| GET | `/devices/:id` | Get one |
| POST | `/devices` | Create |
| PATCH | `/devices/:id` | Update |
| POST | `/devices/:id/toggle` | Turn on/off |
| DELETE | `/devices/:id` | Delete |

## Rooms & Device Groups

| Method | Path | Description |
|--------|------|-------------|
| GET / POST | `/rooms` | List / create rooms |
| PATCH / DELETE | `/rooms/:id` | Update / delete room |
| GET / POST | `/device-groups` | List / create groups |
| PATCH / DELETE | `/device-groups/:id` | Update / delete group |
| POST | `/device-groups/:id/assign` | Assign devices to a group |

## Automation & Schedules

| Method | Path | Description |
|--------|------|-------------|
| GET / POST | `/automation-rules` | List / create rules |
| PATCH / DELETE | `/automation-rules/:id` | Update / delete |
| POST | `/automation-rules/:id/run` | Execute a rule's actions now |
| GET / POST | `/schedules` | List / create (cron validated) |
| PATCH / DELETE | `/schedules/:id` | Update / delete |

## Energy

| Method | Path | Description |
|--------|------|-------------|
| POST | `/energy/record` | Record a usage data point |
| GET | `/energy/summary` | Monthly totals + top devices |
| GET | `/energy/timeseries` | Last-30-day daily series |
| POST | `/energy/predict` | **AI** forecast for the next N hours |

## Recommendations (AI)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recommendations` | List active recommendations |
| POST | `/recommendations/generate` | **AI** generate from recent usage |
| POST | `/recommendations/:id/apply` | Mark applied |
| POST | `/recommendations/:id/dismiss` | Dismiss |

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List (unreadOnly, paginated) |
| POST | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete |

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | Aggregated dashboard payload |
| GET | `/analytics/reports` | Historical snapshots |
| POST | `/analytics/snapshot` | Compute + persist a monthly snapshot |

## Settings & Audit

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET / PATCH | `/settings` | any | Get / update preferences |
| GET | `/audit-logs` | ADMIN, MANAGER | List audit logs (paginated) |

## System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API + AI engine health |

---

## AI Engine endpoints (internal, port 8010)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + model readiness |
| GET | `/metrics` | Training metrics (R², precision, recall) |
| POST | `/ai/energy/predict` | Energy forecast |
| POST | `/ai/anomaly/detect` | Anomaly scoring |
| POST | `/ai/usage/analyze` | Usage clustering & stats |
| POST | `/ai/schedule/optimize` | Optimal run window |
| POST | `/ai/cost/optimize` | Load-shifting cost optimisation |
| POST | `/ai/recommendations` | Combined recommendations |

### Example: forecast energy

```bash
curl -X POST http://localhost:4010/api/v1/energy/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_hour":18,"day_of_week":2,"month":1,"temperature":2,"occupancy":3,"active_devices":6,"horizon":24}'
```
