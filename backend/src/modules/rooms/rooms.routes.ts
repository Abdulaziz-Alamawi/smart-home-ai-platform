import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  floor: z.number().int().min(-5).max(200).default(0),
});
const updateSchema = createSchema.partial();

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: List rooms with device counts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Rooms }
 *   post:
 *     tags: [Rooms]
 *     summary: Create a room
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rooms = await prisma.room.findMany({
      where: { userId: req.user!.sub },
      include: { _count: { select: { devices: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: rooms });
  })
);

router.post(
  "/",
  validate(createSchema),
  audit("create", "room"),
  asyncHandler(async (req, res) => {
    const room = await prisma.room.create({ data: { ...req.body, userId: req.user!.sub } });
    res.status(201).json({ success: true, data: room });
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  audit("update", "room"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.room.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Room not found");
    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: room });
  })
);

router.delete(
  "/:id",
  audit("delete", "room"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.room.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Room not found");
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { success: true } });
  })
);

export default router;
