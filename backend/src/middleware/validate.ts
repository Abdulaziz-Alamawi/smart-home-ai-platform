import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

import { ApiError } from "../utils/ApiError";

type Source = "body" | "query" | "params";

/** Validates and coerces a request part against a Zod schema. */
export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      throw ApiError.badRequest("Validation failed", details);
    }
    // Assign the parsed (typed/coerced) value back.
    req[source] = result.data as never;
    next();
  };
}
