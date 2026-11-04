import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
const bearerWordLenght = 7;

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing access token"));
  }

  try {
    const payload = jwt.verify(header.slice(bearerWordLenght), env.JWT_ACCESS_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
}