import type { AuthenticatedPrincipal } from "../auth";

import {
  canReadTicket,
  isManagerOrAdmin,
  isSupportStaff,
} from "../tickets/ticket.authorization.js";

type CommentTicket = {
  requesterId: string;
  assigneeId: string | null;
};

type CommentAccessRecord = {
  authorId: string;
  isInternalNote: boolean;
  ticket: CommentTicket;
};

export function canReadComments(
  principal: AuthenticatedPrincipal,
  ticket: CommentTicket,
): boolean {
  return canReadTicket(principal, ticket);
}

export function canCreateInternalNote(
  principal: AuthenticatedPrincipal,
): boolean {
  return isSupportStaff(principal);
}

export function canReadComment(
  principal: AuthenticatedPrincipal,
  comment: CommentAccessRecord,
): boolean {
  if (!canReadTicket(principal, comment.ticket)) {
    return false;
  }

  if (
    comment.isInternalNote &&
    !isSupportStaff(principal)
  ) {
    return false;
  }

  return true;
}

export function canEditOrDeleteComment(
  principal: AuthenticatedPrincipal,
  comment: CommentAccessRecord,
): boolean {
  if (!canReadComment(principal, comment)) {
    return false;
  }

  return (
    comment.authorId === principal.subject ||
    isManagerOrAdmin(principal)
  );
}