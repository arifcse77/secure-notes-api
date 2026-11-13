import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

type TokenPayload = { sub: string; role: "user" | "admin"; iat: number; exp: number };

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Authentication required");
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
    if (!mongoose.isValidObjectId(payload.sub) || !["user", "admin"].includes(payload.role)) {
      throw new HttpError(401, "Invalid authentication token");
    }
    req.auth = { userId: new mongoose.Types.ObjectId(payload.sub), role: payload.role };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid or expired token"));
  }
}
