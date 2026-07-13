import type { AuthenticatedPrincipal } from "../auth/auth.types.js";

import { writeTicketEvent } from "../tickets/ticket-event.writer.js";
import { TICKET_EVENT_TYPES } from "../tickets/ticket.constants.js";

import {
  canCreateInternalNote,
  canEditOrDeleteComment,
  canReadComment,
  canReadComments,
} from "./comment.authorization.js";

import { isSupportStaff } from "../tickets/ticket.authorization.js";

import { commentHook } from "./comment.hooks.js";
import { commentRepository } from "./comment.repository.js";
import { commentSerializer } from "./comment.serializer.js";
import { invalidateCommentCache } from "../../utils/cache/cache-invalidation.js";

import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "./comment.schema.js";

export class CommentServiceError extends Error {
  statusCode: number;

  constructor(
    statusCode: number,
    message: string,
  ) {
    super(message);
    this.statusCode = statusCode;
  }
}

function ensureTicketExists<T>(
  ticket: T | null | undefined,
): asserts ticket is NonNullable<T> {
  if (!ticket) {
    throw new CommentServiceError(
      404,
      "Ticket not found.",
    );
  }
}

function ensureCommentExists<T>(
  comment: T | null | undefined,
): asserts comment is NonNullable<T> {
  if (!comment) {
    throw new CommentServiceError(
      404,
      "Comment not found.",
    );
  }
}

function ensureAuthorized(
  authorized: boolean,
  message: string,
): void {
  if (!authorized) {
    throw new CommentServiceError(403, message);
  }
}

export const commentService = {
  async createComment(
    ticketId: string,
    input: CreateCommentInput,
    principal: AuthenticatedPrincipal,
  ) {
    const ticket =
      await commentRepository.findTicketById(
        ticketId,
      );

    ensureTicketExists(ticket);

    ensureAuthorized(
      canReadComments(principal, ticket),
      "You cannot access this ticket.",
    );

    const isInternalNote =
      input.isInternalNote ?? false;

    if (
      isInternalNote &&
      !canCreateInternalNote(principal)
    ) {
      throw new CommentServiceError(
        403,
        "Only agents, managers, and admins can add internal notes.",
      );
    }

    const comment =
      await commentRepository.create({
        ticketId,
        authorId: principal.subject,
        content: input.content,
        isInternalNote,
      });

    await invalidateCommentCache();

    await writeTicketEvent({
      ticketId,
      type: TICKET_EVENT_TYPES.COMMENT_ADDED,
      actorId: principal.subject,
      metadata: {
        commentId: comment.id,
        isInternalNote,
      },
    });

    await commentHook.afterCommentCreated({
      ticketId,
      commentId: comment.id,
      actorId: principal.subject,
      isInternalNote,
    });

    return commentSerializer.item(comment, {
      includeInternalFlag:
        isSupportStaff(principal),
    });
  },

  async listComments(
    ticketId: string,
    principal: AuthenticatedPrincipal,
  ) {
    const ticket =
      await commentRepository.findTicketById(
        ticketId,
      );

    ensureTicketExists(ticket);

    ensureAuthorized(
      canReadComments(principal, ticket),
      "You cannot access this ticket.",
    );

    const includeInternalNotes =
      isSupportStaff(principal);

    const comments =
      await commentRepository.findManyByTicket({
        ticketId,
        includeInternalNotes,
      });

    return commentSerializer.list(comments, {
      includeInternalFlag:
        includeInternalNotes,
    });
  },

  async updateComment(
    commentId: string,
    input: UpdateCommentInput,
    principal: AuthenticatedPrincipal,
  ) {
    const comment =
      await commentRepository.findById(commentId);

    ensureCommentExists(comment);

    /*
     * Returning 404 for invisible internal notes avoids
     * disclosing that the note exists.
     */
    if (!canReadComment(principal, comment)) {
      throw new CommentServiceError(
        404,
        "Comment not found.",
      );
    }

    ensureAuthorized(
      canEditOrDeleteComment(
        principal,
        comment,
      ),
      "You are not allowed to update this comment.",
    );

    const updatedComment =
      await commentRepository.update(
        commentId,
        input,
      );

    await invalidateCommentCache();

    await commentHook.afterCommentUpdated({
      ticketId: updatedComment.ticketId,
      commentId,
      actorId: principal.subject,
      isInternalNote:
        updatedComment.isInternalNote,
    });

    return commentSerializer.item(
      updatedComment,
      {
        includeInternalFlag:
          isSupportStaff(principal),
      },
    );
  },

  async deleteComment(
    commentId: string,
    principal: AuthenticatedPrincipal,
  ) {
    const comment =
      await commentRepository.findById(commentId);

    ensureCommentExists(comment);

    if (!canReadComment(principal, comment)) {
      throw new CommentServiceError(
        404,
        "Comment not found.",
      );
    }

    ensureAuthorized(
      canEditOrDeleteComment(
        principal,
        comment,
      ),
      "You are not allowed to delete this comment.",
    );

    const deletedComment =
      await commentRepository.softDelete(
        commentId,
      );

    await invalidateCommentCache();

    await commentHook.afterCommentDeleted({
      ticketId: deletedComment.ticketId,
      commentId: deletedComment.id,
      actorId: principal.subject,
      isInternalNote:
        deletedComment.isInternalNote,
    });

    return {
      message: "Comment deleted successfully.",
    };
  },
};
