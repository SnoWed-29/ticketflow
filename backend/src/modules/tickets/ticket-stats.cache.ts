import { redisConfig } from "../../config/redis.config";
import { prisma } from "../../db/prisma";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  getNamespaceVersion,
  remember,
} from "../../utils/cache/cache";
import {
  cacheKeys,
  CACHE_NAMESPACES,
} from "../../utils/cache/cache-keys";

export interface TicketCountStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  cancelled: number;
  urgent: number;
}

export async function getCachedTicketCounts(
  scopeKey = "global",
  requesterId?: string,
): Promise<TicketCountStats> {
  const version = await getNamespaceVersion(
    CACHE_NAMESPACES.TICKET_STATS,
  );

  const key = cacheKeys.ticketStats(version, scopeKey);

  return remember(
    key,
    redisConfig.cacheTtl.ticketStats,
    async () => {
      const scopeWhere: Prisma.TicketWhereInput =
        requesterId ? { requesterId } : {};

      const [
        total,
        open,
        inProgress,
        resolved,
        closed,
        cancelled,
        urgent,
      ] = await prisma.$transaction([
        prisma.ticket.count({
          where: scopeWhere,
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            status: "OPEN",
          },
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            status: "IN_PROGRESS",
          },
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            status: "RESOLVED",
          },
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            status: "CLOSED",
          },
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            status: "CANCELLED",
          },
        }),

        prisma.ticket.count({
          where: {
            ...scopeWhere,
            priority: "URGENT",
          },
        }),
      ]);

      return {
        total,
        open,
        inProgress,
        resolved,
        closed,
        cancelled,
        urgent,
      };
    },
  );
}
