import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http";

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== "admin") return next(new HttpError(403, "Administrator access required"));
  next();
}
