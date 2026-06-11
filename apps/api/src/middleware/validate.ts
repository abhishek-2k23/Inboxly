import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";
import type { ApiError } from "@repo/shared";

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error: ApiError = {
        error: result.error.issues.map((issue) => issue.message).join(", "),
      };
      res.status(400).json(error);
      return;
    }

    req.body = result.data;
    next();
  };
}
