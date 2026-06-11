import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";
import { aiClient } from "../../lib/aiClient";

const router = Router();
router.use(authenticate);

const categoryMap: Record<string, string> = {
  cost: "COST",
  efficiency: "EFFICIENCY",
  safety: "SAFETY",
  comfort: "COMFORT",
  info: "INFO",
};
const priorityMap: Record<string, string> = { low: "LOW", medium: "MEDIUM", high: "HIGH" };

/** Build a 24-hour load profile from the user's recent energy records. */
async function buildHourlyProfile(userId: string): Promise<number[]> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const rows = await prisma.energyUsage.findMany({
    where: { userId, recordedAt: { gte: since } },
    select: { energyKwh: true, recordedAt: true },
  });
  const sums = new Array(24).fill(0);
  const counts = new Array(24).fill(0);
  for (const r of rows) {
    const h = r.recordedAt.getHours();
    sums[h] += r.energyKwh;
    counts[h] += 1;
  }
  // Average per hour; fall back to a realistic default profile if no data.
  const profile = sums.map((s, h) => (counts[h] > 0 ? s / counts[h] : 0));
  if (profile.every((v) => v === 0)) {
    return [
      0.4, 0.35, 0.3, 0.3, 0.35, 0.5, 1.2, 1.6, 1.1, 0.8, 0.7, 0.7, 0.8, 0.7, 0.6, 0.7, 0.9, 1.6,
      2.2, 2.4, 1.8, 1.2, 0.7, 0.5,
    ];
  }
  return profile.map((v) => Number(v.toFixed(4)));
}

/**
 * @openapi
 * /recommendations:
 *   get:
 *     tags: [Recommendations]
 *     summary: List stored recommendations
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Recommendations }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const recs = await prisma.recommendation.findMany({
      where: { userId: req.user!.sub, isDismissed: false },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: recs });
  })
);

/**
 * @openapi
 * /recommendations/generate:
 *   post:
 *     tags: [Recommendations]
 *     summary: Generate fresh AI recommendations from recent usage and persist them
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Generated recommendations }
 *       502: { description: AI engine unavailable }
 */
router.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user!.sub } });
    const hourly = await buildHourlyProfile(req.user!.sub);
    const tariff = settings?.energyTariff;

    let aiResult: { recommendations: Array<Record<string, unknown>> };
    try {
      aiResult = (await aiClient.recommendations({
        hourly_kwh: hourly,
        ...(tariff ? { tariff: new Array(24).fill(tariff) } : {}),
      })) as { recommendations: Array<Record<string, unknown>> };
    } catch {
      throw new ApiError(502, "AI engine is unavailable");
    }

    // Replace previous non-dismissed auto recommendations.
    await prisma.recommendation.deleteMany({ where: { userId: req.user!.sub, isApplied: false } });

    const created = await prisma.$transaction(
      aiResult.recommendations.map((r) =>
        prisma.recommendation.create({
          data: {
            userId: req.user!.sub,
            category: (categoryMap[String(r.category)] ?? "INFO") as never,
            priority: (priorityMap[String(r.priority)] ?? "LOW") as never,
            title: String(r.title),
            message: String(r.message),
            estimatedSavings: r.estimated_savings != null ? Number(r.estimated_savings) : null,
            metadata: { sourceId: r.id } as never,
          },
        })
      )
    );

    // Surface high-priority items as notifications.
    const high = created.filter((c) => c.priority === "HIGH");
    if (high.length > 0) {
      await prisma.notification.createMany({
        data: high.map((h) => ({
          userId: req.user!.sub,
          type: "RECOMMENDATION" as never,
          title: h.title,
          message: h.message,
        })),
      });
    }

    res.status(201).json({ success: true, data: created });
  })
);

/**
 * @openapi
 * /recommendations/{id}/dismiss:
 *   post:
 *     tags: [Recommendations]
 *     summary: Dismiss a recommendation
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dismissed }
 */
router.post(
  "/:id/dismiss",
  asyncHandler(async (req, res) => {
    const existing = await prisma.recommendation.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Recommendation not found");
    const rec = await prisma.recommendation.update({ where: { id: req.params.id }, data: { isDismissed: true } });
    res.json({ success: true, data: rec });
  })
);

router.post(
  "/:id/apply",
  asyncHandler(async (req, res) => {
    const existing = await prisma.recommendation.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Recommendation not found");
    const rec = await prisma.recommendation.update({ where: { id: req.params.id }, data: { isApplied: true } });
    res.json({ success: true, data: rec });
  })
);

export default router;
