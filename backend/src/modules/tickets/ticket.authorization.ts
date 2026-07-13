import type {
  AuthenticatedPrincipal,
  TicketRole,
} from "../auth";

import type { TicketSerializerRole } from "./ticket.serializer";

type TicketAccessRecord = {
    requesterId: string;
    assigneeId: string | null;
}

const SUPPORT_ROLES: TicketRole[] = [
  "ticket_agent",
  "ticket_manager",
  "ticket_admin",
];

export function hasRole (
    principal: AuthenticatedPrincipal,
    role: TicketRole
): boolean{
    return principal.roles.includes(role)
}

export function hasManyRole(
    principal: AuthenticatedPrincipal,
    roles: readonly TicketRole[]
): boolean {
    return roles.some((role) => principal.roles.includes(role))
}
export function isSupportStaff(
    principal: AuthenticatedPrincipal
): boolean {
    return hasManyRole(principal,SUPPORT_ROLES);
}
export function isManagerOrAdmin (
    principal: AuthenticatedPrincipal
): boolean{
    return hasManyRole(principal, [
         "ticket_manager",
         "ticket_admin",
    ]);
}

export function isAdmin(
    principal: AuthenticatedPrincipal
): boolean {
    return hasManyRole(principal, [
        "ticket_admin"
    ])
}

export function isTicketOwner(
    principal: AuthenticatedPrincipal,
    ticket: TicketAccessRecord
): boolean {
    return ticket.requesterId === principal.subject;
}

export function isTicketAssignee(
  principal: AuthenticatedPrincipal,
  ticket: TicketAccessRecord,
): boolean {
  return (
    ticket.assigneeId !== null &&
    ticket.assigneeId !== undefined &&
    ticket.assigneeId === principal.subject
  );
}

export function canReadTicket(
  principal: AuthenticatedPrincipal,
  ticket: TicketAccessRecord,
): boolean {
  return (
    isTicketOwner(principal, ticket) ||
    isSupportStaff(principal)
  );
}

export function canUpdateTicket(
  principal: AuthenticatedPrincipal,
  ticket: TicketAccessRecord,
): boolean {
  return (
    isTicketOwner(principal, ticket) ||
    isManagerOrAdmin(principal)
  );
}

export function canCancelTicket(
  principal: AuthenticatedPrincipal,
  ticket: TicketAccessRecord,
): boolean {
  return (
    isTicketOwner(principal, ticket) ||
    isManagerOrAdmin(principal)
  );
}

export function canManageTicketWorkflow(
  principal: AuthenticatedPrincipal,
  ticket: TicketAccessRecord,
): boolean {
  return (
    isSupportStaff(principal) ||
    isTicketAssignee(principal, ticket)
  );
}

export function getTicketSerializerRole(
    principal: AuthenticatedPrincipal,
): TicketSerializerRole {
    if(hasRole(principal, "ticket_admin")) {
        return "ADMIN";
    }

    if (hasRole(principal, "ticket_manager")){
        return "MANAGER";
    }

    if(hasRole(principal, "ticket_agent")) {
        return "MANAGER";
    }

    return "USER";
}