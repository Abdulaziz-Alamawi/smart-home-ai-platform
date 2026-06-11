import { z } from "zod";

const deviceTypes = [
  "LIGHT",
  "THERMOSTAT",
  "PLUG",
  "SENSOR",
  "CAMERA",
  "LOCK",
  "APPLIANCE",
  "EV_CHARGER",
  "HVAC",
  "OTHER",
] as const;

const deviceStatus = ["ONLINE", "OFFLINE", "ERROR"] as const;

export const createDeviceSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(deviceTypes).default("OTHER"),
  powerRatingKw: z.number().positive().max(100).default(0.1),
  roomId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  firmware: z.string().max(60).optional(),
  ipAddress: z.string().max(60).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  status: z.enum(deviceStatus).optional(),
  isOn: z.boolean().optional(),
});

export const toggleSchema = z.object({
  isOn: z.boolean(),
});

export const listQuerySchema = z.object({
  status: z.enum(deviceStatus).optional(),
  type: z.enum(deviceTypes).optional(),
  roomId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
