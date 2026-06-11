import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

// Basic 5-field cron validation (min hour dom mon dow).
const cronRegex =
  /^(\*|([0-5]?\d)(-([0-5]?\d))?(\/\d+)?)(,(\*|([0-5]?\d)(-([0-5]?\d))?(\/\d+)?))*\s+(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/\d+)?)(\s+\S+){3}$/;

const createSchema = z.object({
  name: z.string().min(1).max(120),
  cron: z.string().regex(cronRegex, "Invalid cron expression (use 5-field format)"),
  action: z.record(z.unknown()),
  deviceId: z.string().uuid().optional(),
  isEnabled: z.boolean().default(true),
});
const updateSchema = createSchema.partial();

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: List schedules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Schedules }
 *   post:
 *     tags: [Schedules]
 *     summary: Create a schedule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const schedules = await prisma.schedule.findMany({
      where: { userId: req.user!.sub },
      include: { device: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: schedules });
  })
);

router.post(
  "/",
  validate(createSchema),
  audit("create", "schedule"),
  asyncHandler(async (req, res) => {
    if (req.body.deviceId) {
      const device = await prisma.device.findFirst({ where: { id: req.body.deviceId, userId: req.user!.sub } });
      if (!device) throw ApiError.badRequest("Device does not belong to the user");
    }
    const schedule = await prisma.schedule.create({
      data: {
        name: req.body.name,
        cron: req.body.cron,
        action: req.body.action,
        deviceId: req.body.deviceId,
        isEnabled: req.body.isEnabled,
        userId: req.user!.sub,
      },
    });
    res.status(201).json({ success: true, data: schedule });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  audit("update", "schedule"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.schedule.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Schedule not found");
    const schedule = await prisma.schedule.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: schedule });
  })
);

router.delete(
  "/:id",
  audit("delete", "schedule"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.schedule.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Schedule not found");
    await prisma.schedule.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { success: true } });
  })
);

export default router;
