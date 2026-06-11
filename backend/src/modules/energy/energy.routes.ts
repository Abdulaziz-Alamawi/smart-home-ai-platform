import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";
import { aiClient } from "../../lib/aiClient";
import { startOfMonth, endOfMonth } from "../../utils/time";

const recordSchema = z.object({
  deviceId: z.string().uuid(),
  energyKwh: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  recordedAt: z.coerce.date().optional(),
});

const predictSchema = z.object({
  start_hour: z.number().int().min(0).max(23).default(0),
  day_of_week: z.number().int().min(0).max(6).default(0),
  month: z.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  temperature: z.number().default(21),
  occupancy: z.number().min(0).max(10).default(2),
  active_devices: z.number().min(0).max(50).default(4),
  horizon: z.number().int().min(1).max(48).default(24),
});

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /energy/record:
 *   post:
 *     tags: [Energy]
 *     summary: Record an energy usage data point for a device
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Recorded }
 */
router.post(
  "/record",
  validate(recordSchema),
  asyncHandler(async (req, res) => {
    const device = await prisma.device.findFirst({ where: { id: req.body.deviceId, userId: req.user!.sub } });
    if (!device) throw ApiError.badRequest("Device does not belong to the user");

    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user!.sub } });
    const tariff = settings?.energyTariff ?? 0.18;
    const cost = req.body.cost ?? req.body.energyKwh * tariff;

    const record = await prisma.energyUsage.create({
      data: {
        deviceId: req.body.deviceId,
        userId: req.user!.sub,
        energyKwh: req.body.energyKwh,
        cost,
        recordedAt: req.body.recordedAt ?? new Date(),
      },
    });
    res.status(201).json({ success: true, data: record });
  })
);

/**
 * @openapi
 * /energy/summary:
 *   get:
 *     tags: [Energy]
 *     summary: Monthly energy + cost summary with per-device breakdown
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Summary }
 */
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const from = startOfMonth();
    const to = endOfMonth();
    const where = { userId: req.user!.sub, recordedAt: { gte: from, lte: to } };

    const [agg, byDevice] = await Promise.all([
      prisma.energyUsage.aggregate({ where, _sum: { energyKwh: true, cost: true } }),
      prisma.energyUsage.groupBy({
        by: ["deviceId"],
        where,
        _sum: { energyKwh: true, cost: true },
        orderBy: { _sum: { energyKwh: "desc" } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        periodStart: from,
        periodEnd: to,
        totalEnergyKwh: Number((agg._sum.energyKwh ?? 0).toFixed(4)),
        totalCost: Number((agg._sum.cost ?? 0).toFixed(2)),
        topDevices: byDevice.map((d) => ({
          deviceId: d.deviceId,
          energyKwh: Number((d._sum.energyKwh ?? 0).toFixed(4)),
          cost: Number((d._sum.cost ?? 0).toFixed(2)),
        })),
      },
    });
  })
);

/**
 * @openapi
 * /energy/timeseries:
 *   get:
 *     tags: [Energy]
 *     summary: Daily energy usage time series (last 30 days)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Time series }
 */
router.get(
  "/timeseries",
  asyncHandler(async (req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const rows = await prisma.energyUsage.findMany({
      where: { userId: req.user!.sub, recordedAt: { gte: since } },
      select: { energyKwh: true, cost: true, recordedAt: true },
      orderBy: { recordedAt: "asc" },
    });
    const byDay = new Map<string, { energyKwh: number; cost: number }>();
    for (const r of rows) {
      const key = r.recordedAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { energyKwh: 0, cost: 0 };
      cur.energyKwh += r.energyKwh;
      cur.cost += r.cost;
      byDay.set(key, cur);
    }
    const series = Array.from(byDay.entries()).map(([date, v]) => ({
      date,
      energyKwh: Number(v.energyKwh.toFixed(4)),
      cost: Number(v.cost.toFixed(2)),
    }));
    res.json({ success: true, data: series });
  })
);

/**
 * @openapi
 * /energy/predict:
 *   post:
 *     tags: [Energy]
 *     summary: Forecast upcoming energy consumption via the AI engine
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Forecast }
 *       502: { description: AI engine unavailable }
 */
router.post(
  "/predict",
  validate(predictSchema),
  asyncHandler(async (req, res) => {
    try {
      const forecast = await aiClient.predictEnergy(req.body);
      res.json({ success: true, data: forecast });
    } catch {
      throw new ApiError(502, "AI engine is unavailable");
    }
  })
);

export default router;
