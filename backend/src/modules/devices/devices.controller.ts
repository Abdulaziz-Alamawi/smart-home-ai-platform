import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { devicesService } from "./devices.service";

export const devicesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.list(req.user!.sub, req.query as never);
    res.json({ success: true, ...data });
  }),
  stats: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.stats(req.user!.sub);
    res.json({ success: true, data });
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.getById(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.create(req.user!.sub, req.body);
    res.status(201).json({ success: true, data });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.update(req.user!.sub, req.params.id, req.body);
    res.json({ success: true, data });
  }),
  toggle: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.toggle(req.user!.sub, req.params.id, req.body.isOn);
    res.json({ success: true, data });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const data = await devicesService.remove(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }),
};
