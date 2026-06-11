import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateDeviceInput, UpdateDeviceInput } from "./devices.schema";

interface ListParams {
  status?: string;
  type?: string;
  roomId?: string;
  page: number;
  pageSize: number;
}

export const devicesService = {
  async list(userId: string, params: ListParams) {
    const where: Prisma.DeviceWhereInput = {
      userId,
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.type ? { type: params.type as never } : {}),
      ...(params.roomId ? { roomId: params.roomId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: { room: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.device.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  async getById(userId: string, id: string) {
    const device = await prisma.device.findFirst({
      where: { id, userId },
      include: { room: true, group: true },
    });
    if (!device) throw ApiError.notFound("Device not found");
    return device;
  },

  async create(userId: string, input: CreateDeviceInput) {
    return prisma.device.create({
      data: {
        ...input,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        userId,
      },
    });
  },

  async update(userId: string, id: string, input: UpdateDeviceInput) {
    await this.getById(userId, id);
    return prisma.device.update({
      where: { id },
      data: {
        ...input,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async toggle(userId: string, id: string, isOn: boolean) {
    await this.getById(userId, id);
    return prisma.device.update({
      where: { id },
      data: {
        isOn,
        status: isOn ? "ONLINE" : "OFFLINE",
        lastSeenAt: new Date(),
      },
    });
  },

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.device.delete({ where: { id } });
    return { success: true };
  },

  async stats(userId: string) {
    const [total, online, offline, error] = await Promise.all([
      prisma.device.count({ where: { userId } }),
      prisma.device.count({ where: { userId, status: "ONLINE" } }),
      prisma.device.count({ where: { userId, status: "OFFLINE" } }),
      prisma.device.count({ where: { userId, status: "ERROR" } }),
    ]);
    return { total, online, offline, error };
  },
};
