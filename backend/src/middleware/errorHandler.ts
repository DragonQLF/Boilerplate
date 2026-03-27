import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({ error: "Internal server error" });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
