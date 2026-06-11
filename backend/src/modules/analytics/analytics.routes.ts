import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";
import { startOfMonth, endOfMonth } from "../../utils/time";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Aggregated dashboard metrics (devices, energy, cost, insights)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard payload }
 */
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;
    const from = startOfMonth();
    const to = endOfMonth();

    const [total, online, offline, errored, energyAgg, unreadNotifs, recCount, topRecs] =
      await Promise.all([
        prisma.device.count({ where: { userId } }),
        prisma.device.count({ where: { userId, status: "ONLINE" } }),
        prisma.device.count({ where: { userId, status: "OFFLINE" } }),
        prisma.device.count({ where: { userId, status: "ERROR" } }),
        prisma.energyUsage.aggregate({
          where: { userId, recordedAt: { gte: from, lte: to } },
          _sum: { energyKwh: true, cost: true },
        }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.recommendation.count({ where: { userId, isDismissed: false } }),
        prisma.recommendation.findMany({
          where: { userId, isDismissed: false },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 3,
        }),
      ]);

    res.json({
      success: true,
      data: {
        devices: { total, online, offline, error: errored },
        energy: {
          monthlyKwh: Number((energyAgg._sum.energyKwh ?? 0).toFixed(4)),
          monthlyCost: Number((energyAgg._sum.cost ?? 0).toFixed(2)),
        },
        notifications: { unread: unreadNotifs },
        insights: { count: recCount, top: topRecs },
      },
    });
  })
);

/**
 * @openapi
 * /analytics/reports:
 *   get:
 *     tags: [Analytics]
 *     summary: List historical analytics report snapshots
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reports }
 */
router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const reports = await prisma.analytics.findMany({
      where: { userId: req.user!.sub },
      orderBy: { periodStart: "desc" },
      take: 24,
    });
    res.json({ success: true, data: reports });
  })
);

/**
 * @openapi
 * /analytics/snapshot:
 *   post:
 *     tags: [Analytics]
 *     summary: Compute and persist an analytics snapshot for the current month
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Snapshot created }
 */
router.post(
  "/snapshot",
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;
    const from = startOfMonth();
    const to = endOfMonth();

    const rows = await prisma.energyUsage.findMany({
      where: { userId, recordedAt: { gte: from, lte: to } },
      select: { energyKwh: true, cost: true, recordedAt: true },
    });

    const hourly = new Array(24).fill(0);
    let totalKwh = 0;
    let totalCost = 0;
    for (const r of rows) {
      hourly[r.recordedAt.getHours()] += r.energyKwh;
      totalKwh += r.energyKwh;
      totalCost += r.cost;
    }
    const peakHour = hourly.indexOf(Math.max(...hourly));
    const avg = totalKwh / 24;
    const peak = Math.max(...hourly, 0);
    const loadFactor = peak > 0 ? Number((avg / peak).toFixed(4)) : 0;

    const snapshot = await prisma.analytics.create({
      data: {
        userId,
        periodStart: from,
        periodEnd: to,
        totalEnergyKwh: Number(totalKwh.toFixed(4)),
        totalCost: Number(totalCost.toFixed(2)),
        peakHour: peakHour < 0 ? 0 : peakHour,
        loadFactor,
      },
    });
    res.status(201).json({ success: true, data: snapshot });
  })
);

export default router;
