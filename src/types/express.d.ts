import "express";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: mongoose.Types.ObjectId; role: "user" | "admin" };
    }
  }
}
export {};
