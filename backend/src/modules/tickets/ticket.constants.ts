export const TICKET_STATUSES = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "CANCELLED"
] as const;

export const TICKET_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const DEFAULT_TICKET_STATUS: TicketStatus = "OPEN";
export const DEFAULT_TICKET_PRIORITY: TicketPriority = "MEDIUM";

export const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"],
    IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED", "CANCELLED"],
    RESOLVED: ["IN_PROGRESS", "CLOSED", "CANCELLED"],
    CLOSED: ["OPEN"],
    CANCELLED: [],
};

export const TICKET_EVENT_TYPES = {
    CREATED: "CREATED",
    UPDATED: "UPDATED",
    STATUS_CHANGED: "STATUS_CHANGED",
    PRIORITY_CHANGED: "PRIORITY_CHANGED",
    ASSIGNED: "ASSIGNED",
    UNASSIGNED: "UNASSIGNED",
    CATEGORY_CHANGED: "CATEGORY_CHANGED",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    REOPENED: "REOPENED",   
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE =  20;
export const MAX_PAGE_SIZE = 100;

export const TICKET_LIST_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "title",
  "status",
  "priority",
  "resolvedAt",
  "closedAt",
] as const;

export type TicketSortField = (typeof TICKET_LIST_SORT_FIELDS)[number];
export const DEFAULT_SORT_BY: TicketSortField = "createdAt";
export const DEFAULT_SORT_ORDER = "desc" as const;
