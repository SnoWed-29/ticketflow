import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, test } from "node:test";

import { config as loadEnv } from "dotenv";
import express from "express";

import {
  cacheKeys,
  type CacheNamespace,
} from "../src/utils/cache/cache-keys.js";

const testKeys = new Set<string>();
let redis: typeof import("../src/db/redis.js");
let cache: typeof import("../src/utils/cache/cache.js");
let rateLimit: typeof import("../src/middlewares/rateLimit.js");

before(async () => {
  if (!process.env.REDIS_URL) {
    const rootEnv = loadEnv({
      path: path.resolve(process.cwd(), "../.env"),
      quiet: true,
    }).parsed;
    const password = rootEnv?.REDIS_PASSWORD;
    const port = rootEnv?.REDIS_PORT ?? "6379";

    if (password) {
      process.env.REDIS_URL =
        `redis://:${encodeURIComponent(password)}@localhost:${port}`;
    }
  }

  redis = await import("../src/db/redis.js");
  cache = await import("../src/utils/cache/cache.js");
  rateLimit = await import("../src/middlewares/rateLimit.js");
  await redis.connectRedis();
});

after(async () => {
  if (testKeys.size > 0 && redis.redisClient.isReady) {
    await redis.redisClient.del([...testKeys]);
  }

  await redis.disconnectRedis();
});

test("remember stores and reuses a JSON value with a TTL", async () => {
  const key = `ticketflow:test:cache:${randomUUID()}`;
  testKeys.add(key);
  let loads = 0;

  const loader = async () => {
    loads += 1;
    return { source: "database", loads };
  };

  const first = await cache.remember(key, 30, loader);
  const second = await cache.remember(key, 30, loader);

  assert.deepEqual(first, { source: "database", loads: 1 });
  assert.deepEqual(second, first);
  assert.equal(loads, 1);
  assert.ok(await redis.redisClient.ttl(key) > 0);
});

test("namespace version bumps invalidate old cache keys", async () => {
  const namespace =
    `integration-${randomUUID()}` as CacheNamespace;
  const versionKey = cacheKeys.version(namespace);
  testKeys.add(versionKey);

  assert.equal(await cache.getNamespaceVersion(namespace), 1);
  await cache.bumpCacheNamespaceVersion(namespace);
  assert.equal(await cache.getNamespaceVersion(namespace), 2);
});

test("Redis-backed limiter rejects requests over its limit", async () => {
  const suffix = randomUUID();
  const clientKey = "integration-client";
  const redisKey =
    `ticketflow:rate-limit:integration-${suffix}:${clientKey}`;
  testKeys.add(redisKey);

  const app = express();
  app.get(
    "/limited",
    rateLimit.createRedisRateLimiter({
      windowMs: 30_000,
      max: 2,
      prefix: `integration-${suffix}`,
      keyGenerator: () => clientKey,
    }),
    (_request, response) => {
      response.status(200).json({ ok: true });
    },
  );

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/limited`;
    const responses = [];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      responses.push(await fetch(url));
    }

    assert.deepEqual(
      responses.map((response) => response.status),
      [200, 200, 429],
    );
    assert.equal(
      (await responses[2].json() as { message: string }).message,
      "Too many requests. Please try again later.",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});
