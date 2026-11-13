import mongoose, { InferSchemaType, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", required: true },
  interests: { type: [String], default: [], set: (items: string[]) => [...new Set(items.map(v => v.trim().toLowerCase()).filter(Boolean))] }
}, { timestamps: true, versionKey: false });

type UserDocument = InferSchemaType<typeof userSchema> & mongoose.Document & {
  comparePassword(candidate: string): Promise<boolean>;
};

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1, _id: -1 });

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = (password: string) =>
  bcrypt.hash(password, env.BCRYPT_ROUNDS);

export interface UserModel extends Model<UserDocument> {
  hashPassword(password: string): Promise<string>;
}

export const User = mongoose.model<UserDocument, UserModel>("User", userSchema);
