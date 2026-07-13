import "dotenv/config";
import express, { type Request, type Response } from "express";
import observabilityRoutes from "./observability/observability.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js"
import commentRoutes from "./modules/comments/comment.routes.js";
import ticketCommentRoutes from "./modules/comments/ticket-comments.routes.js";
import { authenticate } from "./modules/auth/auth.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { prisma } from "./db/prisma.js";



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

app.use("/api", authRouter);

app.use("/api/tickets", ticketRoutes);
app.use("/api/tickets", ticketCommentRoutes);
app.use("/api/comments", commentRoutes);

const server = app.listen(port, host, () => {
  console.log(`TicketFlow backend listening on http://${host}:${port}`);
});

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`TicketFlow backend received ${signal}; shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void shutdown(signal));
}
