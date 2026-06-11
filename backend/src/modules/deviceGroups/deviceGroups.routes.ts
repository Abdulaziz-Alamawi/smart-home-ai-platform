import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

const createSchema = z.object({ name: z.string().min(1).max(120) });
const updateSchema = createSchema.partial();
const assignSchema = z.object({ deviceIds: z.array(z.string().uuid()).min(1) });

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /device-groups:
 *   get:
 *     tags: [DeviceGroups]
 *     summary: List device groups
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Groups }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const groups = await prisma.deviceGroup.findMany({
      where: { userId: req.user!.sub },
      include: { _count: { select: { devices: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: groups });
  })
);

router.post(
  "/",
  validate(createSchema),
  audit("create", "deviceGroup"),
  asyncHandler(async (req, res) => {
    const group = await prisma.deviceGroup.create({ data: { ...req.body, userId: req.user!.sub } });
    res.status(201).json({ success: true, data: group });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  audit("update", "deviceGroup"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.deviceGroup.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Group not found");
    const group = await prisma.deviceGroup.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: group });
  })
);

/**
 * @openapi
 * /device-groups/{id}/assign:
 *   post:
 *     tags: [DeviceGroups]
 *     summary: Assign devices to a group
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 */
router.post(
  "/:id/assign",
  validate(assignSchema),
  audit("assign", "deviceGroup"),
  asyncHandler(async (req, res) => {
    const group = await prisma.deviceGroup.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!group) throw ApiError.notFound("Group not found");
    await prisma.device.updateMany({
      where: { id: { in: req.body.deviceIds }, userId: req.user!.sub },
      data: { groupId: req.params.id },
    });
    res.json({ success: true, data: { assigned: req.body.deviceIds.length } });
  })
);

router.delete(
  "/:id",
  audit("delete", "deviceGroup"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.deviceGroup.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Group not found");
    await prisma.deviceGroup.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { success: true } });
  })
);

export default router;
