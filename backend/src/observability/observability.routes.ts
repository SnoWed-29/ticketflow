import net from "node:net";
import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "ticketflow-backend",
        timestamp: new Date().toISOString(),
    });
});

type DependencyStatus = "connected" | "unavailable";

async function checkRedis(): Promise<void> {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://redis:6379");
  const port = Number(redisUrl.port || 6379);
  const password = decodeURIComponent(redisUrl.password);
  const username = decodeURIComponent(redisUrl.username);

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: redisUrl.hostname, port });
    let response = "";

    const finish = (error?: Error): void => {
      socket.destroy();
      error ? reject(error) : resolve();
    };

    socket.setTimeout(2_000, () => finish(new Error("Redis timed out")));
    socket.once("error", finish);
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (response.includes("-ERR") || response.includes("-WRONGPASS")) {
        finish(new Error("Redis rejected the readiness probe"));
      } else if (response.includes("+PONG")) {
        finish();
      }
    });
    socket.once("connect", () => {
      const commands: string[] = [];
      if (password) {
        const authArguments = username ? [username, password] : [password];
        commands.push(
          `*${authArguments.length + 1}\r\n$4\r\nAUTH\r\n${authArguments
            .map((argument) => `$${Buffer.byteLength(argument)}\r\n${argument}\r\n`)
            .join("")}`,
        );
      }
      commands.push("*1\r\n$4\r\nPING\r\n");
      socket.write(commands.join(""));
    });
  });
}

async function checkHttpDependency(url: string, headers?: HeadersInit): Promise<void> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) {
    throw new Error(`Dependency returned HTTP ${response.status}`);
  }
}

router.get("/ready", async (_req, res) => {
    const statuses: Record<string, DependencyStatus> = {
      database: "unavailable",
      redis: "unavailable",
      keycloak: "unavailable",
      meilisearch: "unavailable",
    };

    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`.then(() => { statuses.database = "connected"; }),
      checkRedis().then(() => { statuses.redis = "connected"; }),
      checkHttpDependency(process.env.KEYCLOAK_JWKS_URL ?? "").then(() => {
        statuses.keycloak = "connected";
      }),
      checkHttpDependency(
        new URL("/health", process.env.MEILISEARCH_URL ?? "http://meilisearch:7700").toString(),
        process.env.MEILISEARCH_MASTER_KEY
          ? { Authorization: `Bearer ${process.env.MEILISEARCH_MASTER_KEY}` }
          : undefined,
      ).then(() => { statuses.meilisearch = "connected"; }),
    ]);

    const ready = checks.every((check) => check.status === "fulfilled");
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      dependencies: statuses,
      timestamp: new Date().toISOString(),
    });
});

router.get("/metrics", (_req, res) => {
    res
    .type("text/plain; version=0.0.4; charset=utf-8")
    .send(
      [
        "# HELP ticketflow_up Whether the TicketFlow backend is running.",
        "# TYPE ticketflow_up gauge",
        "ticketflow_up 1",
        "",
      ].join("\n"),
    );
});

export default router;
