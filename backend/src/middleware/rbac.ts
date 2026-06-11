import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError";

/** Role-Based Access Control: restricts a route to the given roles. */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw ApiError.forbidden("You do not have permission to perform this action");
    }
    next();
  };
}
