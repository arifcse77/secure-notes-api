import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
  content: { type: String, required: true, maxlength: 50000 }
}, { timestamps: true, versionKey: false });

// Supports a user's newest-first note list and owner-scoped note lookup.
noteSchema.index({ userId: 1, createdAt: -1, _id: -1 });
// Supports the admin all-notes newest-first paginated list. This is a separate
// access pattern: the owner-first index cannot provide a global createdAt sort.
noteSchema.index({ createdAt: -1, _id: -1 });

export const Note = mongoose.model("Note", noteSchema);
