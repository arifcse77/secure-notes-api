import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap() {
  await connectDatabase();
  app.listen(env.PORT, () => console.info(`API listening on port ${env.PORT}`));
}
bootstrap().catch(error => {
  console.error("Application startup failed", error);
  process.exit(1);
});
