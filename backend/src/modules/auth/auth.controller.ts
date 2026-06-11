import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: result });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.me(req.user!.sub);
    res.json({ success: true, data: result });
  }),
};
