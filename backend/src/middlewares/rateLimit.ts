import type { RequestHandler } from "express";
import {
  ipKeyGenerator,
  rateLimit,
  type ValueDeterminingMiddleware,
} from "express-rate-limit";
import {
  RedisStore,
  type RedisReply,
} from "rate-limit-redis";

import { redisConfig } from "../config/redis.config.js";
import { redisClient } from "../db/redis.js";

type RedisRateLimiterOptions = {
  windowMs: number;
  max: number;
  prefix: string;
  keyGenerator?: ValueDeterminingMiddleware<string>;
};

export const authenticatedSubjectKey = (
  request: Parameters<ValueDeterminingMiddleware<string>>[0],
): string => {
  return request.auth?.subject
    ?? ipKeyGenerator(request.ip ?? "0.0.0.0");
};

export function createRedisRateLimiter({
  windowMs,
  max,
  prefix,
  keyGenerator,
}: RedisRateLimiterOptions): RequestHandler {
  let middleware: RequestHandler | undefined;

  return (request, response, next) => {
    if (!redisConfig.rateLimitEnabled) {
      next();
      return;
    }

    if (!middleware) {
      const store = new RedisStore({
        prefix: `ticketflow:rate-limit:${prefix}:`,
        sendCommand: (...args: string[]) =>
          redisClient.sendCommand(args) as Promise<RedisReply>,
      });

      middleware = rateLimit({
        windowMs,
        limit: max,
        store,
        keyGenerator,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        passOnStoreError: false,
        validate: {
          // This wrapper initializes exactly once on the first request,
          // after startup has established the Redis connection.
          creationStack: false,
        },
        handler: (_request, rateLimitResponse) => {
          rateLimitResponse.status(429).json({
            message:
              "Too many requests. Please try again later.",
          });
        },
      });
    }

    return middleware(request, response, next);
  };
}

export const generalApiRateLimiter =
  createRedisRateLimiter({
    ...redisConfig.rateLimit.general,
    prefix: "general",
    keyGenerator: authenticatedSubjectKey,
  });

export const ticketCreationRateLimiter =
  createRedisRateLimiter({
    ...redisConfig.rateLimit.ticketCreation,
    prefix: "ticket-create",
    keyGenerator: authenticatedSubjectKey,
  });

export const commentCreationRateLimiter =
  createRedisRateLimiter({
    ...redisConfig.rateLimit.commentCreation,
    prefix: "comment-create",
    keyGenerator: authenticatedSubjectKey,
  });
