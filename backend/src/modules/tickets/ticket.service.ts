import type { AuthenticatedPrincipal } from "../auth/auth.types.js";

import {
  ALLOWED_STATUS_TRANSITIONS,
  DEFAULT_TICKET_PRIORITY,
  TICKET_EVENT_TYPES,
  type TicketStatus,
} from "./ticket.constants.js";

import { writeTicketEvent } from "./ticket-event.writer.js";
import { ticketRepository } from "./ticket.repository.js";
import { ticketSerializer } from "./ticket.serializer.js";
import { invalidateTicketCache } from "../../utils/cache/cache-invalidation.js";

import {
  canCancelTicket,
  canManageTicketWorkflow,
  canReadTicket,
  canUpdateTicket,
  getTicketSerializerRole,
  isSupportStaff,
} from "./ticket.authorization.js";

import type {
  AssignTicketInput,
  ChangePriorityInput,
  ChangeStatusInput,
  CreateTicketInput,
  TicketDetailQuery,
  TicketListQuery,
  UpdateTicketInput,
} from "./ticket.schema.js";

export class TicketServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function ensureTicketExists<T>(
  ticket: T | null | undefined,
): asserts ticket is NonNullable<T> {
  if (!ticket) {
    throw new TicketServiceError(
      404,
      "Ticket not found.",
    );
  }
}

function ensureAuthorized(
  authorized: boolean,
  message = "You do not have permission to perform this action.",
): void {
  if (!authorized) {
    throw new TicketServiceError(403, message);
  }
}

const getChangedFields = (
  before: Record<string, unknown>,
  afterInput: Record<string, unknown>,
) => {
  const changes: Record<
    string,
    {
      oldValue: unknown;
      newValue: unknown;
    }
  > = {};

  for (const [field, newValue] of Object.entries(
    afterInput,
  )) {
    if (newValue === undefined) {
      continue;
    }

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
  async createTicket(
    input: CreateTicketInput,
    principal: AuthenticatedPrincipal,
  ) {
    const category =
      await ticketRepository.findCategoryById(
        input.categoryId,
      );

    if (!category) {
      throw new TicketServiceError(
        400,
        "Category does not exist or is inactive.",
      );
    }

    /*
     * The authenticated Keycloak subject is always the requester.
     * A body requesterId must never override it.
     */
    const ticket = await ticketRepository.create({
      ...input,
      requesterId: principal.subject,
      priority:
        input.priority ?? DEFAULT_TICKET_PRIORITY,
    });

    await invalidateTicketCache();

    await writeTicketEvent({
      ticketId: ticket.id,
      type: TICKET_EVENT_TYPES.CREATED,
      actorId: principal.subject,
      metadata: {
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        categoryId: ticket.categoryId,
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
      },
    });

    return ticketSerializer.detail(ticket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async listTickets(
    query: TicketListQuery,
    principal: AuthenticatedPrincipal,
  ) {
    /*
     * Users are forced to their own requesterId.
     * Support staff can use the validated requester filter.
     */
    const authorizedQuery: TicketListQuery =
      isSupportStaff(principal)
        ? query
        : {
            ...query,
            requesterId: principal.subject,
          };

    const result =
      await ticketRepository.findMany(
        authorizedQuery,
      );

    return ticketSerializer.listResponse(result);
  },

  async getTicketById(
    id: string,
    options: TicketDetailQuery,
    principal: AuthenticatedPrincipal,
  ) {
    const ticket =
      await ticketRepository.findById(id, options);

    ensureTicketExists(ticket);

    ensureAuthorized(
      canReadTicket(principal, ticket),
      "You cannot access this ticket.",
    );

    return ticketSerializer.detail(ticket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async updateTicket(
    id: string,
    input: UpdateTicketInput,
    principal: AuthenticatedPrincipal,
  ) {
    const currentTicket =
      await ticketRepository.findById(id);

    ensureTicketExists(currentTicket);

    ensureAuthorized(
      canUpdateTicket(principal, currentTicket),
      "You cannot update this ticket.",
    );

    if (
      input.categoryId !== undefined &&
      input.categoryId !== null
    ) {
      const category =
        await ticketRepository.findCategoryById(
          input.categoryId,
        );

      if (!category) {
        throw new TicketServiceError(
          400,
          "Category does not exist or is inactive.",
        );
      }
    }

    const changes = getChangedFields(
      currentTicket as unknown as Record<
        string,
        unknown
      >,
      input as Record<string, unknown>,
    );

    const updatedTicket =
      await ticketRepository.update(id, input);

    await invalidateTicketCache();

    if (
      input.categoryId !== undefined &&
      currentTicket.categoryId !== input.categoryId
    ) {
      await writeTicketEvent({
        ticketId: id,
        type: TICKET_EVENT_TYPES.CATEGORY_CHANGED,
        actorId: principal.subject,
        oldValue: currentTicket.categoryId,
        newValue: input.categoryId,
      });
    }

    if (Object.keys(changes).length > 0) {
      await writeTicketEvent({
        ticketId: id,
        type: TICKET_EVENT_TYPES.UPDATED,
        actorId: principal.subject,
        metadata: {
          changes,
        },
      });
    }

    return ticketSerializer.detail(updatedTicket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async changeStatus(
    id: string,
    input: ChangeStatusInput,
    principal: AuthenticatedPrincipal,
  ) {
    const currentTicket =
      await ticketRepository.findById(id);

    ensureTicketExists(currentTicket);

    ensureAuthorized(
      canManageTicketWorkflow(
        principal,
        currentTicket,
      ),
      "You cannot change this ticket's status.",
    );

    const currentStatus =
      currentTicket.status as TicketStatus;

    const nextStatus = input.status;

    if (currentStatus === nextStatus) {
      return ticketSerializer.detail(
        currentTicket,
        {
          role: getTicketSerializerRole(principal),
        },
      );
    }

    const allowedNextStatuses =
      ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

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
      (currentStatus === "CLOSED" ||
        currentStatus === "RESOLVED") &&
      (nextStatus === "OPEN" ||
        nextStatus === "IN_PROGRESS");

    if (isResolving) {
      statusUpdate.resolvedAt =
        currentTicket.resolvedAt ?? new Date();
    }

    if (isClosing) {
      statusUpdate.closedAt =
        currentTicket.closedAt ?? new Date();

      if (!currentTicket.resolvedAt) {
        statusUpdate.resolvedAt = new Date();
      }
    }

    if (isReopening) {
      statusUpdate.closedAt = null;
      statusUpdate.resolvedAt = null;
    }

    const updatedTicket =
      await ticketRepository.updateStatus(
        id,
        statusUpdate,
      );

    await invalidateTicketCache();

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
      actorId: principal.subject,
      oldValue: currentStatus,
      newValue: nextStatus,
      metadata: {
        resolvedAt: updatedTicket.resolvedAt,
        closedAt: updatedTicket.closedAt,
      },
    });

    return ticketSerializer.detail(updatedTicket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async assignTicket(
    id: string,
    input: AssignTicketInput,
    principal: AuthenticatedPrincipal,
  ) {
    const currentTicket =
      await ticketRepository.findById(id);

    ensureTicketExists(currentTicket);

    ensureAuthorized(
      canManageTicketWorkflow(
        principal,
        currentTicket,
      ),
      "You cannot assign this ticket.",
    );

    if (
      currentTicket.assigneeId ===
      input.assigneeId
    ) {
      return ticketSerializer.detail(
        currentTicket,
        {
          role: getTicketSerializerRole(principal),
        },
      );
    }

    const updatedTicket =
      await ticketRepository.assign(id, input);

    await invalidateTicketCache();

    await writeTicketEvent({
      ticketId: id,
      type: input.assigneeId
        ? TICKET_EVENT_TYPES.ASSIGNED
        : TICKET_EVENT_TYPES.UNASSIGNED,
      actorId: principal.subject,
      oldValue: currentTicket.assigneeId,
      newValue: input.assigneeId ?? null,
    });

    return ticketSerializer.detail(updatedTicket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async changePriority(
    id: string,
    input: ChangePriorityInput,
    principal: AuthenticatedPrincipal,
  ) {
    const currentTicket =
      await ticketRepository.findById(id);

    ensureTicketExists(currentTicket);

    ensureAuthorized(
      canManageTicketWorkflow(
        principal,
        currentTicket,
      ),
      "You cannot change this ticket's priority.",
    );

    if (
      currentTicket.priority === input.priority
    ) {
      return ticketSerializer.detail(
        currentTicket,
        {
          role: getTicketSerializerRole(principal),
        },
      );
    }

    const updatedTicket =
      await ticketRepository.updatePriority(
        id,
        input.priority,
      );

    await invalidateTicketCache();

    await writeTicketEvent({
      ticketId: id,
      type: TICKET_EVENT_TYPES.PRIORITY_CHANGED,
      actorId: principal.subject,
      oldValue: currentTicket.priority,
      newValue: input.priority,
    });

    return ticketSerializer.detail(updatedTicket, {
      role: getTicketSerializerRole(principal),
    });
  },

  async deleteTicket(
    id: string,
    principal: AuthenticatedPrincipal,
  ) {
    const currentTicket =
      await ticketRepository.findById(id);

    ensureTicketExists(currentTicket);

    ensureAuthorized(
      canCancelTicket(principal, currentTicket),
      "You cannot cancel this ticket.",
    );

    const cancelledTicket =
      await ticketRepository.markAsCancelled(id);

    await invalidateTicketCache();

    await writeTicketEvent({
      ticketId: id,
      type: TICKET_EVENT_TYPES.STATUS_CHANGED,
      actorId: principal.subject,
      oldValue: currentTicket.status,
      newValue: "CANCELLED",
      metadata: {
        action: "SAFE_DELETE",
        reason:
          "No deletedAt field exists in the current Prisma schema.",
      },
    });

    return {
      message:
        "Ticket cancelled successfully. This is the safe delete behavior for the current schema.",
      data: ticketSerializer.detail(
        cancelledTicket,
        {
          role: getTicketSerializerRole(principal),
        },
      ),
    };
  },
};
