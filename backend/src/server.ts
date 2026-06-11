import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { initRealtime } from "./lib/realtime";

async function bootstrap(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Smart Home AI API listening on port ${env.port}`, {
      env: env.nodeEnv,
      docs: `http://localhost:${env.port}/api/docs`,
    });
  });

  // Attach the real-time telemetry gateway (Socket.IO)
  initRealtime(server);

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error("Failed to start server", { error: (err as Error).message });
  process.exit(1);
});
