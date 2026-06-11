import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import devicesRoutes from "../modules/devices/devices.routes";
import roomsRoutes from "../modules/rooms/rooms.routes";
import deviceGroupsRoutes from "../modules/deviceGroups/deviceGroups.routes";
import automationRoutes from "../modules/automation/automation.routes";
import schedulesRoutes from "../modules/schedules/schedules.routes";
import energyRoutes from "../modules/energy/energy.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import recommendationsRoutes from "../modules/recommendations/recommendations.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import auditRoutes from "../modules/audit/audit.routes";
import iotRoutes from "../modules/iot/iot.routes";
import { aiClient } from "../lib/aiClient";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: API + AI engine health check
 *     responses:
 *       200: { description: Healthy }
 */
router.get("/health", async (_req, res) => {
  const aiHealthy = await aiClient.health();
  res.json({
    success: true,
    data: { status: "ok", api: true, aiEngine: aiHealthy, timestamp: new Date().toISOString() },
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/devices", devicesRoutes);
router.use("/rooms", roomsRoutes);
router.use("/device-groups", deviceGroupsRoutes);
router.use("/automation-rules", automationRoutes);
router.use("/schedules", schedulesRoutes);
router.use("/energy", energyRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/recommendations", recommendationsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/iot", iotRoutes);

export default router;
