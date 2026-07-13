const positiveInteger = (
  name: string,
  fallback: number,
): number => {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
};

export const redisConfig = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",

  cacheEnabled: process.env.CACHE_ENABLED !== "false",
  rateLimitEnabled:
    process.env.RATE_LIMIT_ENABLED !== "false",

  cacheTtl: {
    categories: positiveInteger(
      "CATEGORY_CACHE_TTL_SECONDS",
      300,
    ),
    ticketStats: positiveInteger(
      "TICKET_STATS_CACHE_TTL_SECONDS",
      60,
    ),
  },

  rateLimit: {
    general: {
      windowMs: positiveInteger(
        "GENERAL_RATE_LIMIT_WINDOW_MS",
        60_000,
      ),
      max: positiveInteger(
        "GENERAL_RATE_LIMIT_MAX",
        100,
      ),
    },
    ticketCreation: {
      windowMs: positiveInteger(
        "TICKET_CREATE_RATE_LIMIT_WINDOW_MS",
        60_000,
      ),
      max: positiveInteger(
        "TICKET_CREATE_RATE_LIMIT_MAX",
        5,
      ),
    },
    commentCreation: {
      windowMs: positiveInteger(
        "COMMENT_CREATE_RATE_LIMIT_WINDOW_MS",
        60_000,
      ),
      max: positiveInteger(
        "COMMENT_CREATE_RATE_LIMIT_MAX",
        20,
      ),
    },
  },
} as const;
