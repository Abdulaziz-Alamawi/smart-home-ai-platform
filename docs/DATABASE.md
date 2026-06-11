# Database

> **Author:** Abdulaziz AlAmawi · Smart Home AI Platform

PostgreSQL 16, modelled with Prisma. The schema lives in
[`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) and the initial SQL
migration in [`backend/prisma/migrations/0001_init/migration.sql`](../backend/prisma/migrations/0001_init).

## Entity relationship overview

```
User 1───* Device          User 1───1 UserSettings
User 1───* Room            User 1───* RefreshToken
User 1───* DeviceGroup     User 1───* AutomationRule
User 1───* Schedule        User 1───* Notification
User 1───* EnergyUsage     User 1───* Recommendation
User 1───* Analytics       User 1───* AuditLog

Room 1───* Device
DeviceGroup 1───* Device
Device 1───* EnergyUsage
Device 1───* Schedule
```

## Tables

| Model | Purpose | Key fields |
|-------|---------|------------|
| **User** | Account identity | email (unique), passwordHash, role, isActive |
| **RefreshToken** | Revocable refresh tokens | token (unique), expiresAt, revoked |
| **UserSettings** | Per-user preferences | theme, currency, energyTariff, timezone |
| **Room** | Physical spaces | name, floor |
| **DeviceGroup** | Logical device groupings | name |
| **Device** | Smart devices | type, status, powerRatingKw, isOn, lastSeenAt |
| **EnergyUsage** | Telemetry data points | energyKwh, cost, recordedAt |
| **AutomationRule** | Event-driven automations | trigger, conditions(JSON), actions(JSON) |
| **Schedule** | Cron-based actions | cron, action(JSON), nextRunAt |
| **Notification** | User notifications | type, title, message, isRead |
| **Recommendation** | AI recommendations | category, priority, estimatedSavings |
| **Analytics** | Periodic snapshots | totalEnergyKwh, totalCost, peakHour, loadFactor |
| **AuditLog** | Security/audit trail | action, resource, ipAddress, userAgent |

## Enums

- `Role`: ADMIN, MANAGER, USER
- `DeviceType`: LIGHT, THERMOSTAT, PLUG, SENSOR, CAMERA, LOCK, APPLIANCE, EV_CHARGER, HVAC, OTHER
- `DeviceStatus`: ONLINE, OFFLINE, ERROR
- `NotificationType`: INFO, WARNING, ALERT, RECOMMENDATION
- `RecommendationCategory`: COST, EFFICIENCY, SAFETY, COMFORT, INFO
- `Priority`: LOW, MEDIUM, HIGH
- `AutomationTrigger`: SCHEDULE, SENSOR, DEVICE_STATE, ENERGY_THRESHOLD, AI_RECOMMENDATION

## Referential integrity

- Deleting a `User` cascades to all owned records.
- Deleting a `Room` / `DeviceGroup` sets the device FK to `NULL` (devices survive).
- Deleting a `Device` cascades to its `EnergyUsage`; schedules' deviceId is set `NULL`.
- `AuditLog.userId` is `SET NULL` on user deletion to preserve the trail.

## Indexing strategy

Indices exist on every foreign key plus high-traffic query paths:
`User.email`, `Device.status`, `EnergyUsage(userId, recordedAt)`,
`EnergyUsage(deviceId, recordedAt)`, `Notification(userId, isRead)`,
`Analytics(userId, periodStart)`, and the `AuditLog` resource/time columns.

## Migrations

```bash
# Apply migrations in production
npx prisma migrate deploy

# Create a new migration during development
npx prisma migrate dev --name <change>

# Regenerate the client after schema changes
npx prisma generate
```
