import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.issues });
  }

  // PostgreSQL unique violation: two requests registered the same email at once
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}