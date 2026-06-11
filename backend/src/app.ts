import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import apiRoutes from "./routes";
import { swaggerSpec } from "./lib/swagger";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }

  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // API docs
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

  // Versioned API
  app.use("/api/v1", apiRoutes);

  // Root
  app.get("/", (_req, res) => {
    res.json({
      service: "Smart Home AI Platform API",
      version: "1.0.0",
      docs: "/api/docs",
      health: "/api/v1/health",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
