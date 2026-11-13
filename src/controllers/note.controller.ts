import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Note } from "../models/Note";
import { HttpError, getPagination, paginationMeta } from "../utils/http";

const noteInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000)
});

export async function createNote(req: Request, res: Response) {
  const input = noteInput.parse(req.body);
  const note = await Note.create({ ...input, userId: req.auth!.userId });
  res.status(201).json({ note });
}

export async function listMyNotes(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const filter = { userId: req.auth!.userId };
  const [items, total] = await Promise.all([
    Note.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Note.countDocuments(filter)
  ]);
  res.json({ items, pagination: paginationMeta(page, limit, total) });
}

export async function getMyNote(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid note ID");
  const note = await Note.findOne({ _id: req.params.id, userId: req.auth!.userId }).lean();
  if (!note) throw new HttpError(404, "Note not found");
  res.json({ note });
}

export async function updateMyNote(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid note ID");
  const input = noteInput.partial().refine(v => Object.keys(v).length > 0, "Provide at least one field").parse(req.body);
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth!.userId }, { $set: input },
    { new: true, runValidators: true }
  );
  if (!note) throw new HttpError(404, "Note not found");
  res.json({ note });
}

export async function deleteMyNote(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid note ID");
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.auth!.userId });
  if (!note) throw new HttpError(404, "Note not found");
  res.status(204).send();
}

export async function adminListNotes(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await Promise.all([
    Note.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)
      .populate("userId", "name email").lean(),
    Note.countDocuments()
  ]);
  res.json({ items, pagination: paginationMeta(page, limit, total) });
}
