import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { User } from "../models/User";

async function main() {
  if (!env.ADMIN_NAME || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }
  await connectDatabase();
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.info("Admin already exists; no changes made.");
  } else {
    const passwordHash = await User.hashPassword(env.ADMIN_PASSWORD);
    await User.create({ name: env.ADMIN_NAME, email, passwordHash, role: "admin" });
    console.info(`Admin created: ${email}`);
  }
  process.exit(0);
}
main().catch(error => { console.error(error); process.exit(1); });
