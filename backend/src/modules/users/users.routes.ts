import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional(),
});

const adminUpdateSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "USER"]).optional(),
  isActive: z.boolean().optional(),
});

const publicUser = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /users/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated profile }
 */
router.patch(
  "/profile",
  validate(updateProfileSchema),
  audit("update", "profile"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
      select: publicUser,
    });
    res.json({ success: true, data: user });
  })
);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (ADMIN/MANAGER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users }
 *       403: { description: Forbidden }
 */
router.get(
  "/",
  authorize("ADMIN", "MANAGER"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: users });
  })
);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's role or status (ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  "/:id",
  authorize("ADMIN"),
  validate(adminUpdateSchema),
  audit("update", "user"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("User not found");
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: publicUser,
    });
    res.json({ success: true, data: user });
  })
);

export default router;
