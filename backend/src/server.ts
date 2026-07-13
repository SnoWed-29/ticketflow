import "dotenv/config";
import express, { type Request, type Response } from "express";
import type { Server } from "node:http";
import observabilityRoutes from "./observability/observability.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js"
import commentRoutes from "./modules/comments/comment.routes.js";
import ticketCommentRoutes from "./modules/comments/ticket-comments.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import { authenticate } from "./modules/auth/auth.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { prisma } from "./db/prisma.js";
import {
  connectRedis,
  disconnectRedis,
} from "./db/redis.js";
import { redisConfig } from "./config/redis.config.js";
import { generalApiRateLimiter } from "./middlewares/rateLimit.js";



const app = express();
const port = Number(process.env.PORT ?? 5000);
const host = process.env.HOST ?? "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}
app.disable("x-powered-by");

app.use(express.json());

app.use("/", observabilityRoutes);

app.use("/api", authenticate);
app.use("/api", generalApiRateLimiter);

app.use("/api", authRouter);

app.use("/api/tickets", ticketRoutes);
app.use("/api/tickets", ticketCommentRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/categories", categoryRoutes);

let server: Server | undefined;

async function start(): Promise<void> {
  if (
    redisConfig.cacheEnabled ||
    redisConfig.rateLimitEnabled
  ) {
    await connectRedis();
  }

  server = app.listen(port, host, () => {
    console.log(
      `TicketFlow backend listening on http://${host}:${port}`,
    );
  });
}

async function closeDependencies(): Promise<void> {
  const results = await Promise.allSettled([
    disconnectRedis(),
    prisma.$disconnect(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "Failed to close a backend dependency:",
        result.reason,
      );
    }
  }
}

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`TicketFlow backend received ${signal}; shutting down.`);
  if (!server) {
    await closeDependencies();
    process.exit(0);
  }

  server.close(async () => {
    await closeDependencies();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void shutdown(signal));
}

void start().catch(async (error) => {
  console.error("TicketFlow backend failed to start:", error);
  await closeDependencies();
  process.exitCode = 1;
});
