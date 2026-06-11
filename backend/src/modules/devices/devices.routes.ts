import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { audit } from "../../middleware/audit";
import { validate } from "../../middleware/validate";
import { devicesController } from "./devices.controller";
import {
  createDeviceSchema,
  listQuerySchema,
  toggleSchema,
  updateDeviceSchema,
} from "./devices.schema";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /devices:
 *   get:
 *     tags: [Devices]
 *     summary: List devices (paginated, filterable)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ONLINE, OFFLINE, ERROR] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of devices }
 *   post:
 *     tags: [Devices]
 *     summary: Create a device
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.get("/", validate(listQuerySchema, "query"), devicesController.list);

/**
 * @openapi
 * /devices/stats:
 *   get:
 *     tags: [Devices]
 *     summary: Device counts by status (total/online/offline/error)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Device statistics }
 */
router.get("/stats", devicesController.stats);

/**
 * @openapi
 * /devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get a device by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Device }
 *       404: { description: Not found }
 */
router.get("/:id", devicesController.get);
router.post("/", validate(createDeviceSchema), audit("create", "device"), devicesController.create);
router.patch("/:id", validate(updateDeviceSchema), audit("update", "device"), devicesController.update);

/**
 * @openapi
 * /devices/{id}/toggle:
 *   post:
 *     tags: [Devices]
 *     summary: Turn a device on or off
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated device }
 */
router.post("/:id/toggle", validate(toggleSchema), audit("toggle", "device"), devicesController.toggle);
router.delete("/:id", audit("delete", "device"), devicesController.remove);

export default router;
