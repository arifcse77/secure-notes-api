import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  interests: z.array(z.string().trim().min(1).max(50)).max(30).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});

function issueToken(user: { _id: unknown; role: "user" | "admin" }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user._id), expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: "HS256"
  });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const passwordHash = await User.hashPassword(input.password);
  const user = await User.create({
    name: input.name, email: input.email.toLowerCase(), passwordHash,
    interests: input.interests ?? [], role: "user"
  });
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, interests: user.interests },
    token: issueToken(user)
  });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(input.password))) {
    throw new HttpError(401, "Invalid email or password");
  }
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: issueToken(user)
  });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.auth!.userId).select("name email role interests createdAt");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}
