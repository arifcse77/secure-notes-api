import mongoose from "mongoose";
import { env } from "./env";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production"
    }).then((connection) => {
      console.info("MongoDB connected");
      return connection;
    }).catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
}
