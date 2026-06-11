import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

const listQuery = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications (paginated)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Notifications }
 */
router.get(
  "/",
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuery>;
    const where = { userId: req.user!.sub, ...(q.unreadOnly ? { isRead: false } : {}) };
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.sub, isRead: false } }),
    ]);
    res.json({ success: true, items, total, unread, page: q.page, pageSize: q.pageSize });
  })
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 */
router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Notification not found");
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true, data: n });
  })
);

/**
 * @openapi
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated count }
 */
router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, data: { updated: result.count } });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!existing) throw ApiError.notFound("Notification not found");
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { success: true } });
  })
);

export default router;
