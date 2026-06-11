import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";

const updateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  currency: z.string().min(2).max(8).optional(),
  energyTariff: z.number().positive().max(10).optional(),
  timezone: z.string().min(2).max(60).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get the current user's settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Settings }
 *   patch:
 *     tags: [Settings]
 *     summary: Update settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated settings }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.sub },
      update: {},
      create: { userId: req.user!.sub },
    });
    res.json({ success: true, data: settings });
  })
);

router.patch(
  "/",
  validate(updateSchema),
  audit("update", "settings"),
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.sub },
      update: req.body,
      create: { userId: req.user!.sub, ...req.body },
    });
    res.json({ success: true, data: settings });
  })
);

export default router;
