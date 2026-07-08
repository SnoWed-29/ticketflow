const serializeCategory = (category: any) => {
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
  };
};

const serializeComment = (comment: any) => {
  return {
    id: comment.id,
    content: comment.content,
    ticketId: comment.ticketId,
    authorId: comment.authorId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

const serializeEvent = (event: any) => {
  return {
    id: event.id,
    type: event.type,
    ticketId: event.ticketId,
    actorId: event.actorId,
    oldValue: event.oldValue,
    newValue: event.newValue,
    metadata: event.metadata,
    createdAt: event.createdAt,
  };
};

export const ticketSerializer = {
  listItem(ticket: any) {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      requesterId: ticket.requesterId,
      assigneeId: ticket.assigneeId,
      categoryId: ticket.categoryId,
      category: serializeCategory(ticket.category),
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  },

  detail(ticket: any) {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      requesterId: ticket.requesterId,
      assigneeId: ticket.assigneeId,
      categoryId: ticket.categoryId,
      category: serializeCategory(ticket.category),
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,

      comments: Array.isArray(ticket.comments)
        ? ticket.comments.map(serializeComment)
        : undefined,

      events: Array.isArray(ticket.events)
        ? ticket.events.map(serializeEvent)
        : undefined,
    };
  },

  listResponse(result: {
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }) {
    return {
      data: result.items.map((ticket) => this.listItem(ticket)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  },
};