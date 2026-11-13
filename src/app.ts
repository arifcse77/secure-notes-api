import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { HttpError } from "./utils/http";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map(v => v.trim()), credentials: false }));
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);
app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));
app.use(errorHandler);

export default app;
