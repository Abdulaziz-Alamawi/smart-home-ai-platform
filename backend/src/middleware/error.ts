import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { logger } from "../lib/logger";
import { ApiError } from "../utils/ApiError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this unique value already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else {
      statusCode = 400;
      message = "Database request error";
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error("Unhandled error", { message, path: req.path, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    error: { message, ...(details ? { details } : {}) },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}
