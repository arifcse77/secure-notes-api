import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { HttpError, getPagination, paginationMeta } from "../utils/http";

/**
 * Exactly one User.aggregate() invocation. No find/count/distinct calls.
 * Pagination and total group count are both computed in this pipeline.
 */
export async function usersGroupedByInterest(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const result = await User.aggregate([
    { $unwind: "$interests" },
    { $group: {
      _id: "$interests",
      users: { $push: { id: "$_id", name: "$name", email: "$email" } },
      totalUsers: { $sum: 1 }
    } },
    { $sort: { _id: 1 } },
    { $facet: {
      items: [{ $skip: skip }, { $limit: limit }],
      metadata: [{ $count: "total" }]
    } }
  ]);
  const data = result[0] ?? { items: [], metadata: [] };
  const total = data.metadata[0]?.total ?? 0;
  res.json({ items: data.items, pagination: paginationMeta(page, limit, total) });
}

/**
 * One User.aggregate() pipeline containing $lookup. The user match uses _id's
 * built-in index; the lookup uses the Posts.userId index. Results are paginated.
 */
export async function getUserPosts(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid user ID");
  }
  const { page, limit, skip } = getPagination(req);
  const result = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $lookup: {
      from: "posts",
      localField: "_id",
      foreignField: "userId",
      as: "posts"
    } },
    { $unwind: { path: "$posts", preserveNullAndEmptyArrays: false } },
    { $sort: { "posts.createdAt": -1, "posts._id": -1 } },
    { $facet: {
      items: [{ $skip: skip }, { $limit: limit }, { $replaceRoot: { newRoot: "$posts" } }],
      metadata: [{ $count: "total" }]
    } }
  ]);
  const data = result[0] ?? { items: [], metadata: [] };
  const total = data.metadata[0]?.total ?? 0;
  res.json({ items: data.items, pagination: paginationMeta(page, limit, total) });
}
