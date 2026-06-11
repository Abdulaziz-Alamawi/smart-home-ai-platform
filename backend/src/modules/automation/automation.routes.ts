import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

const triggers = ["SCHEDULE", "SENSOR", "DEVICE_STATE", "ENERGY_THRESHOLD", "AI_RECOMMENDATION"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  trigger: z.enum(triggers),
  conditions: z.record(z.unknown()),
  actions: z.array(z.record(z.unknown())).min(1),
  isEnabled: z.boolean().default(true),
});
const updateSchema = createSchema.partial();

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /automation-rules:
 *   get:
 *     tags: [Automation]
 *     summary: List automation rules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Rules }
 *   post:
 *     tags: [Automation]
 *     summary: Create an automation rule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rules = await prisma.automationRule.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rules });
  })
);

router.post(
  "/",
  validate(createSchema),
  audit("create", "automationRule"),
  asyncHandler(async (req, res) => {
    const rule = await prisma.automationRule.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        trigger: req.body.trigger,
        conditions: req.body.conditions,
        actions: req.body.actions,
        isEnabled: req.body.isEnabled,
        userId: req.user!.sub,
      },
    });
    res.status(201).json({ success: true, data: rule });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  audit("update", "automationRule"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Rule not found");
    const rule = await prisma.automationRule.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: rule });
  })
);

/**
 * @openapi
 * /automation-rules/{id}/run:
 *   post:
 *     tags: [Automation]
 *     summary: Manually trigger an automation rule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Executed }
 */
router.post(
  "/:id/run",
  audit("run", "automationRule"),
  asyncHandler(async (req, res) => {
    const rule = await prisma.automationRule.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!rule) throw ApiError.notFound("Rule not found");
    if (!rule.isEnabled) throw ApiError.badRequest("Rule is disabled");

    // Execute the rule's device actions.
    const actions = (rule.actions as Array<Record<string, unknown>>) ?? [];
    let executed = 0;
    for (const action of actions) {
      const deviceId = action.deviceId as string | undefined;
      const isOn = action.isOn as boolean | undefined;
      if (deviceId && typeof isOn === "boolean") {
        const owned = await prisma.device.findFirst({ where: { id: deviceId, userId: req.user!.sub } });
        if (owned) {
          await prisma.device.update({
            where: { id: deviceId },
            data: { isOn, status: isOn ? "ONLINE" : "OFFLINE", lastSeenAt: new Date() },
          });
          executed += 1;
        }
      }
    }
    await prisma.automationRule.update({ where: { id: rule.id }, data: { lastRunAt: new Date() } });
    res.json({ success: true, data: { executedActions: executed } });
  })
);

router.delete(
  "/:id",
  audit("delete", "automationRule"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Rule not found");
    await prisma.automationRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { success: true } });
  })
);

export default router;
