import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { User } from "../models/User";
import { HttpError, getPagination, paginationMeta } from "../utils/http";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(12).max(128),
  role: z.enum(["user", "admin"]).default("user"),
  interests: z.array(z.string().trim().min(1).max(50)).max(30).optional()
});
const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(12).max(128).optional(),
  role: z.enum(["user", "admin"]).optional(),
  interests: z.array(z.string().trim().min(1).max(50)).max(30).optional()
}).refine(v => Object.keys(v).length > 0, "Provide at least one field");

export async function createUser(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const { password, ...fields } = input;
  const user = await User.create({ ...fields, passwordHash: await User.hashPassword(password) });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, interests: user.interests } });
}

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await Promise.all([
    User.find().select("name email role interests createdAt")
      .sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments()
  ]);
  res.json({ items, pagination: paginationMeta(page, limit, total) });
}

export async function getUser(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid user ID");
  const user = await User.findById(req.params.id).select("name email role interests createdAt").lean();
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}

export async function updateUser(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid user ID");
  if (req.params.id === String(req.auth!.userId) && req.body.role && req.body.role !== "admin") {
    throw new HttpError(400, "You cannot remove your own administrator role");
  }
  const input = updateSchema.parse(req.body);
  const { password, ...fields } = input;
  const update: Record<string, unknown> = { ...fields };
  if (password) update.passwordHash = await User.hashPassword(password);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, {
    new: true, runValidators: true
  }).select("name email role interests createdAt");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}

export async function deleteUser(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid user ID");
  if (req.params.id === String(req.auth!.userId)) throw new HttpError(400, "You cannot delete your own account");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  // Notes/posts are intentionally not silently cascade-deleted; define a retention policy before doing so.
  res.status(204).send();
}
