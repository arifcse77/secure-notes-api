import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 50000 },
  published: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

// Required by the foreignField side of the User -> Posts $lookup.
postSchema.index({ userId: 1 });
// Supports the public published-post feed sorted newest first.
postSchema.index({ published: 1, createdAt: -1, _id: -1 });

export const Post = mongoose.model("Post", postSchema);
