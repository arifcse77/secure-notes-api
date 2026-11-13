import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/http";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: "Validation failed", details: error.message }); return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: "Invalid identifier" }); return;
  }
  if ((error as { code?: number }).code === 11000) {
    res.status(409).json({ error: "A record with that unique value already exists" }); return;
  }
  const status = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : "Internal server error";
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
};
