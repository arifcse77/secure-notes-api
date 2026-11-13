import { Request, Response } from "express";
import { z } from "zod";
import { Post } from "../models/Post";
import { getPagination, paginationMeta } from "../utils/http";

const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().min(1).max(50000),
  published: z.boolean().optional()
});

export async function createPost(req: Request, res: Response) {
  const input = postSchema.parse(req.body);
  const post = await Post.create({ ...input, userId: req.auth!.userId });
  res.status(201).json({ post });
}

// Posts are public. Every list operation is paginated.
export async function listPublicPosts(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const filter = { published: true };
  const [items, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)
      .populate("userId", "name").lean(),
    Post.countDocuments(filter)
  ]);
  res.json({ items, pagination: paginationMeta(page, limit, total) });
}
