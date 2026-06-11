import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";

const listQuery = z.object({
  resource: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: List audit logs (ADMIN/MANAGER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Audit logs }
 *       403: { description: Forbidden }
 */
router.get(
  "/",
  authorize("ADMIN", "MANAGER"),
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuery>;
    const where = q.resource ? { resource: q.resource } : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, email: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, items, total, page: q.page, pageSize: q.pageSize });
  })
);

export default router;
