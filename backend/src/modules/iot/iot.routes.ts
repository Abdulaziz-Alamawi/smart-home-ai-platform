import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { getSimulatorSnapshot } from "../../lib/realtime";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /iot/snapshot:
 *   get:
 *     tags: [IoT]
 *     summary: Current snapshot of the IoT simulation engine (fleet + rooms + power)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Live simulation snapshot }
 */
router.get(
  "/snapshot",
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: getSimulatorSnapshot() });
  })
);

export default router;
