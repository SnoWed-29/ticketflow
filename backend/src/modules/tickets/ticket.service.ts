import {
  ALLOWED_STATUS_TRANSITIONS,
  DEFAULT_TICKET_PRIORITY,
  TICKET_EVENT_TYPES,
  type TicketStatus,
} from "./ticket.constants.js";
import { writeTicketEvent } from "./ticket-event.writer.js";
import { ticketRepository } from "./ticket.repository.js";
import { ticketSerializer } from "./ticket.serializer.js";
import type {
  AssignTicketInput,
  ChangePriorityInput,
  ChangeStatusInput,
  CreateTicketInput,
  TicketListQuery,
  UpdateTicketInput,
} from "./ticket.validator.js";

export class TicketServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

type ActorContext = {
  actorId?: string | null;
};

type TicketDetailOptions = {
  includeComments?: boolean;
  includeEvents?: boolean;
};

function ensureTicketExists<T>(
  ticket: T | null | undefined,
): asserts ticket is NonNullable<T> {
  if (!ticket) {
    throw new TicketServiceError(404, "Ticket not found.");
  }
}

const getChangedFields = (before: any, afterInput: Record<string, unknown>) => {
  const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};

  for (const [field, newValue] of Object.entries(afterInput)) {
    if (newValue === undefined) continue;

    const oldValue = before[field];

    if (oldValue !== newValue) {
      changes[field] = {
        oldValue,
        newValue,
      };
    }
  }

  return changes;
};

export const ticketService = {
  async createTicket(input: CreateTicketInput, context: ActorContext = {}) {
    const requesterId = input.requesterId ?? context.actorId;

    if (!requesterId) {
      throw new TicketServiceError(
        400,
        "requesterId is required until authentication is implemented.",
      );
    }

    const category = await ticketRepository.findCategoryById(input.categoryId);

    if (!category) {
      throw new TicketServiceError(400, "Category does not exist or is inactive.");
    }

    const ticket = await ticketRepository.create({
      ...input,
      requesterId,
      priority: input.priority ?? DEFAULT_TICKET_PRIORITY,
    });

    await writeTicketEvent({
      ticketId: ticket.id,
      type: TICKET_EVENT_TYPES.CREATED,
      actorId: context.actorId ?? requesterId,
      metadata: {
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        categoryId: ticket.categoryId,
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
      },
    });

    return ticketSerializer.detail(ticket);
  },

  async listTickets(query: TicketListQuery) {
    const result = await ticketRepository.findMany(query);
    return ticketSerializer.listResponse(result);
  },

  async getTicketById(id: string, options: TicketDetailOptions = {}) {
    const ticket = await ticketRepository.findById(id, options);
    ensureTicketExists(ticket);
    return ticketSerializer.detail(ticket);
  },

  async updateTicket(
    id: string,
    input: UpdateTicketInput,
    context: ActorContext = {},
  ) {
    const currentTicket = await ticketRepository.findById(id);
    ensureTicketExists(currentTicket);

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await ticketRepository.findCategoryById(input.categoryId);

      if (!category) {
        throw new TicketServiceError(400, "Category does not exist or is inactive.");
      }
    }

    const changes = getChangedFields(currentTicket, input as Record<string, unknown>);

    const updatedTicket = await ticketRepository.update(id, input);

    if (input.categoryId !== undefined && currentTicket.categoryId !== input.categoryId) {
      await writeTicketEvent({
        ticketId: id,
        type: TICKET_EVENT_TYPES.CATEGORY_CHANGED,
        actorId: context.actorId,
        oldValue: currentTicket.categoryId,
        newValue: input.categoryId,
      });
    }

    if (Object.keys(changes).length > 0) {
      await writeTicketEvent({
        ticketId: id,
        type: TICKET_EVENT_TYPES.UPDATED,
        actorId: context.actorId,
        metadata: {
          changes,
        },
      });
    }

    return ticketSerializer.detail(updatedTicket);
  },

  async changeStatus(
    id: string,
    input: ChangeStatusInput,
    context: ActorContext = {},
  ) {
    const currentTicket = await ticketRepository.findById(id);
    ensureTicketExists(currentTicket);

    const currentStatus = currentTicket.status as TicketStatus;
    const nextStatus = input.status;

    if (currentStatus === nextStatus) {
      return ticketSerializer.detail(currentTicket);
    }

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new TicketServiceError(
        400,
        `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
      );
    }

    const statusUpdate: {
      status: TicketStatus;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
    } = {
      status: nextStatus,
    };

    const isResolving = nextStatus === "RESOLVED";
    const isClosing = nextStatus === "CLOSED";
    const isReopening =
      (currentStatus === "CLOSED" || currentStatus === "RESOLVED") &&
      (nextStatus === "OPEN" || nextStatus === "IN_PROGRESS");

    if (isResolving) {
      statusUpdate.resolvedAt = currentTicket.resolvedAt ?? new Date();
    }

    if (isClosing) {
      statusUpdate.closedAt = currentTicket.closedAt ?? new Date();

      if (!currentTicket.resolvedAt) {
        statusUpdate.resolvedAt = new Date();
      }
    }

    if (isReopening) {
      statusUpdate.closedAt = null;
      statusUpdate.resolvedAt = null;
    }

    const updatedTicket = await ticketRepository.updateStatus(id, statusUpdate);

    const eventType = isClosing
      ? TICKET_EVENT_TYPES.CLOSED
      : isReopening
        ? TICKET_EVENT_TYPES.REOPENED
        : isResolving
          ? TICKET_EVENT_TYPES.RESOLVED
          : TICKET_EVENT_TYPES.STATUS_CHANGED;

    await writeTicketEvent({
      ticketId: id,
      type: eventType,
      actorId: context.actorId,
      oldValue: currentStatus,
      newValue: nextStatus,
      metadata: {
        resolvedAt: updatedTicket.resolvedAt,
        closedAt: updatedTicket.closedAt,
      },
    });

    return ticketSerializer.detail(updatedTicket);
  },

  async assignTicket(
    id: string,
    input: AssignTicketInput,
    context: ActorContext = {},
  ) {
    const currentTicket = await ticketRepository.findById(id);
    ensureTicketExists(currentTicket);

    if (currentTicket.assigneeId === input.assigneeId) {
      return ticketSerializer.detail(currentTicket);
    }

    const updatedTicket = await ticketRepository.assign(id, input);

    await writeTicketEvent({
      ticketId: id,
      type: input.assigneeId
        ? TICKET_EVENT_TYPES.ASSIGNED
        : TICKET_EVENT_TYPES.UNASSIGNED,
      actorId: context.actorId,
      oldValue: currentTicket.assigneeId,
      newValue: input.assigneeId ?? null,
    });

    return ticketSerializer.detail(updatedTicket);
  },

  async changePriority(
    id: string,
    input: ChangePriorityInput,
    context: ActorContext = {},
  ) {
    const currentTicket = await ticketRepository.findById(id);
    ensureTicketExists(currentTicket);

    if (currentTicket.priority === input.priority) {
      return ticketSerializer.detail(currentTicket);
    }

    const updatedTicket = await ticketRepository.updatePriority(id, input.priority);

    await writeTicketEvent({
      ticketId: id,
      type: TICKET_EVENT_TYPES.PRIORITY_CHANGED,
      actorId: context.actorId,
      oldValue: currentTicket.priority,
      newValue: input.priority,
    });

    return ticketSerializer.detail(updatedTicket);
  },

  async deleteTicket(id: string, context: ActorContext = {}) {
    const currentTicket = await ticketRepository.findById(id);
    ensureTicketExists(currentTicket);

    const cancelledTicket = await ticketRepository.markAsCancelled(id);

    await writeTicketEvent({
      ticketId: id,
      type: TICKET_EVENT_TYPES.STATUS_CHANGED,
      actorId: context.actorId,
      oldValue: currentTicket.status,
      newValue: "CANCELLED",
      metadata: {
        action: "SAFE_DELETE",
        reason: "No deletedAt field exists in the current Prisma schema.",
      },
    });

    return {
      message: "Ticket cancelled successfully. This is the safe delete behavior for the current schema.",
      data: ticketSerializer.detail(cancelledTicket),
    };
  },
};
