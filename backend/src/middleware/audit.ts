import { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

/**
 * Records a mutating request into the AuditLog table after it succeeds.
 * Fire-and-forget: auditing must never break the main request.
 */
export function audit(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      const userId = req.user?.sub;
      prisma.auditLog
        .create({
          data: {
            userId: userId ?? null,
            action,
            resource,
            resourceId: (req.params?.id as string) ?? null,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] ?? null,
          },
        })
        .catch((err) => logger.warn("Audit log failed", { error: (err as Error).message }));
    });
    next();
  };
}
