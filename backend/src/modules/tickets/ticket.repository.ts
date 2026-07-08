import { prisma } from "../../db/prisma.js";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  type TicketPriority,
  type TicketStatus,
} from "./ticket.constants.js";
import type {
  AssignTicketInput,
  CreateTicketInput,
  TicketListQuery,
  UpdateTicketInput,
} from "./ticket.validator.js";

const buildTicketWhere = (query: TicketListQuery) => {
  const where: any = {};

  if (query.status) {
    where.status = query.status;
  } else if (!query.includeCancelled) {
    where.status = {
      not: "CANCELLED",
    };
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.assigneeId) {
    where.assigneeId = query.assigneeId;
  }

  if (query.requesterId) {
    where.requesterId = query.requesterId;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};

    if (query.dateFrom) {
      where.createdAt.gte = new Date(query.dateFrom);
    }

    if (query.dateTo) {
      where.createdAt.lte = new Date(query.dateTo);
    }
  }

  if (query.search) {
    where.OR = [
      {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
};

export const ticketRepository = {
  async create(input: CreateTicketInput & { requesterId: string }) {
    return prisma.ticket.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        priority: input.priority,
        requesterId: input.requesterId,
        assigneeId: input.assigneeId ?? null,
        categoryId: input.categoryId,
      },
    });
  },

  async findMany(query: TicketListQuery) {
    const page = query.page || 1;
    const limit = query.limit || DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where = buildTicketWhere(query);

    const orderBy = {
      [query.sortBy || DEFAULT_SORT_BY]: query.sortOrder || DEFAULT_SORT_ORDER,
    };

    const [items, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string, options: { includeComments?: boolean; includeEvents?: boolean } = {}) {
    const include: any = {
      category: true,
    };

    if (options.includeComments) {
      include.comments = {
        orderBy: {
          createdAt: "asc",
        },
      };
    }

    if (options.includeEvents) {
      include.events = {
        orderBy: {
          createdAt: "desc",
        },
      };
    }

    return prisma.ticket.findFirst({
      where: {
        id,
        status: {
          not: "CANCELLED",
        },
      },
      include,
    });
  },

  async findByIdIncludingCancelled(id: string) {
    return prisma.ticket.findUnique({
      where: {
        id,
      },
    });
  },

  async update(id: string, input: UpdateTicketInput) {
    const data: any = {};

    if (input.title !== undefined) {
      data.title = input.title.trim();
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.categoryId !== undefined) {
      data.categoryId = input.categoryId;
    }

    if (input.assigneeId !== undefined) {
      data.assigneeId = input.assigneeId;
    }

    return prisma.ticket.update({
      where: {
        id,
      },
      data,
    });
  },

  async updateStatus(
    id: string,
    input: {
      status: TicketStatus;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
    },
  ) {
    const data: any = {
      status: input.status,
    };

    if (input.resolvedAt !== undefined) {
      data.resolvedAt = input.resolvedAt;
    }

    if (input.closedAt !== undefined) {
      data.closedAt = input.closedAt;
    }

    return prisma.ticket.update({
      where: {
        id,
      },
      data,
    });
  },

  async assign(id: string, input: AssignTicketInput) {
    return prisma.ticket.update({
      where: {
        id,
      },
      data: {
        assigneeId: input.assigneeId ?? null,
      },
    });
  },

  async updatePriority(id: string, priority: TicketPriority) {
    return prisma.ticket.update({
      where: {
        id,
      },
      data: {
        priority,
      },
    });
  },

  async markAsCancelled(id: string) {
    return prisma.ticket.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
      },
    });
  },

  async findCategoryById(categoryId: string) {
    return prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
    });
  },
};