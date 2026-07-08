import type { RequestHandler, Response } from "express";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  TICKET_LIST_SORT_FIELDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "./ticket.constants.js";

export type CreateTicketInput = {
    title: string;
    description: string;
    priority?: TicketPriority;
    categoryId: string;
    requesterId?: string;
    assigneeId?: string;
};

export type UpdateTicketInput = {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  assigneeId?: string | null;
};

export type ChangeStatusInput = {
  status: TicketStatus;
};

export type AssignTicketInput = {
  assigneeId?: string | null;
};

export type ChangePriorityInput = {
  priority: TicketPriority;
};

export type TicketListQuery = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assigneeId?: string;
  requesterId?: string;
  creatorId?: string;
  dateFrom?: string;
  dateTo?: string;
  includeCancelled?: boolean;
};

const sendValidationError = (res: Response, errors: string[]) => {
    res.status(400).json({
        message: "Validation failed",
        errors,
    })
};

const isNonEmptyString = (value: unknown): value is string => {
    return typeof value =="string" && value.trim().length > 0;
};
const getSingleQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return String(value[0]);
  if (typeof value === "string") return value;
  return undefined;
};

const isValidDate = (value: string): boolean => {
  return !Number.isNaN(Date.parse(value));
};

const isValidStatus = (value: unknown): value is TicketStatus => {
  return typeof value === "string" && TICKET_STATUSES.includes(value as TicketStatus);
};

const isValidPriority = (value: unknown): value is TicketPriority => {
  return typeof value === "string" && TICKET_PRIORITIES.includes(value as TicketPriority);
};

export const validateTicketId: RequestHandler = (req, res, next) => {
  if (!isNonEmptyString(req.params.id)) {
    sendValidationError(res, ["Ticket id is required."]);
    return;
  }

  next();
};

export const validateCreateTicketBody: RequestHandler = (req, res, next) => {
  const errors: string[] = [];
  const body = req.body as CreateTicketInput;

  if (!isNonEmptyString(body.title)) {
    errors.push("title is required.");
  }

  if (!isNonEmptyString(body.description)) {
    errors.push("description is required.");
  }

  if (!isNonEmptyString(body.categoryId)) {
    errors.push("categoryId is required.");
  }

  if (body.priority !== undefined && !isValidPriority(body.priority)) {
    errors.push(`priority must be one of: ${TICKET_PRIORITIES.join(", ")}.`);
  }

  if (
    body.assigneeId !== undefined &&
    body.assigneeId !== null &&
    !isNonEmptyString(body.assigneeId)
  ) {
    errors.push("assigneeId must be a string or null.");
  }

  if ((body as any).assignedGroupId !== undefined) {
    errors.push("assignedGroupId is not supported by the current Prisma schema.");
  }

  if (errors.length > 0) {
    sendValidationError(res, errors);
    return;
  }

  next();
};

export const validateUpdateTicketBody: RequestHandler = (req, res, next) => {
  const errors: string[] = [];
  const body = req.body as UpdateTicketInput;

  const hasAllowedField =
    body.title !== undefined ||
    body.description !== undefined ||
    body.categoryId !== undefined ||
    body.assigneeId !== undefined;

  if (!hasAllowedField) {
    errors.push("At least one updatable field is required.");
  }

  if (body.title !== undefined && !isNonEmptyString(body.title)) {
    errors.push("title must be a non-empty string.");
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    !isNonEmptyString(body.description)
  ) {
    errors.push("description must be a string or null.");
  }

  if (
    body.categoryId !== undefined &&
    body.categoryId !== null &&
    !isNonEmptyString(body.categoryId)
  ) {
    errors.push("categoryId must be a string or null.");
  }

  if (
    body.assigneeId !== undefined &&
    body.assigneeId !== null &&
    !isNonEmptyString(body.assigneeId)
  ) {
    errors.push("assigneeId must be a string or null.");
  }

  if ((body as any).assignedGroupId !== undefined) {
    errors.push("assignedGroupId is not supported by the current Prisma schema.");
  }

  if (errors.length > 0) {
    sendValidationError(res, errors);
    return;
  }

  next();
};

export const validateChangeStatusBody: RequestHandler = (req, res, next) => {
  const body = req.body as ChangeStatusInput;

  if (!isValidStatus(body.status)) {
    sendValidationError(res, [
      `status must be one of: ${TICKET_STATUSES.join(", ")}.`,
    ]);
    return;
  }

  next();
};

export const validateAssignTicketBody: RequestHandler = (req, res, next) => {
  const errors: string[] = [];
  const body = req.body as AssignTicketInput;

  if (!Object.prototype.hasOwnProperty.call(body, "assigneeId")) {
    errors.push("assigneeId is required.");
  }

  if (
    body.assigneeId !== undefined &&
    body.assigneeId !== null &&
    !isNonEmptyString(body.assigneeId)
  ) {
    errors.push("assigneeId must be a string or null.");
  }

  if ((body as any).assignedGroupId !== undefined) {
    errors.push("assignedGroupId is not supported by the current Prisma schema.");
  }

  if (errors.length > 0) {
    sendValidationError(res, errors);
    return;
  }

  next();
};

export const validateChangePriorityBody: RequestHandler = (req, res, next) => {
  const body = req.body as ChangePriorityInput;

  if (!isValidPriority(body.priority)) {
    sendValidationError(res, [
      `priority must be one of: ${TICKET_PRIORITIES.join(", ")}.`,
    ]);
    return;
  }

  next();
};

export const validateListTicketsQuery: RequestHandler = (req, res, next) => {
  const errors: string[] = [];

  const page = Number(getSingleQueryValue(req.query.page) ?? DEFAULT_PAGE);
  const limit = Number(getSingleQueryValue(req.query.limit) ?? DEFAULT_PAGE_SIZE);
  const sortBy = getSingleQueryValue(req.query.sortBy) ?? "createdAt";
  const sortOrder = getSingleQueryValue(req.query.sortOrder) ?? "desc";
  const status = getSingleQueryValue(req.query.status);
  const priority = getSingleQueryValue(req.query.priority);
  const dateFrom = getSingleQueryValue(req.query.dateFrom);
  const dateTo = getSingleQueryValue(req.query.dateTo);

  if (!Number.isInteger(page) || page < 1) {
    errors.push("page must be a positive integer.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    errors.push(`limit must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  if (!TICKET_LIST_SORT_FIELDS.includes(sortBy as any)) {
    errors.push(`sortBy must be one of: ${TICKET_LIST_SORT_FIELDS.join(", ")}.`);
  }

  if (sortOrder !== "asc" && sortOrder !== "desc") {
    errors.push("sortOrder must be either asc or desc.");
  }

  if (status !== undefined && !isValidStatus(status)) {
    errors.push(`status must be one of: ${TICKET_STATUSES.join(", ")}.`);
  }

  if (priority !== undefined && !isValidPriority(priority)) {
    errors.push(`priority must be one of: ${TICKET_PRIORITIES.join(", ")}.`);
  }

  if (dateFrom !== undefined && !isValidDate(dateFrom)) {
    errors.push("dateFrom must be a valid date.");
  }

  if (dateTo !== undefined && !isValidDate(dateTo)) {
    errors.push("dateTo must be a valid date.");
  }

  if (req.query.assignedGroupId !== undefined) {
    errors.push("assignedGroupId filter is not supported by the current Prisma schema.");
  }

  if (errors.length > 0) {
    sendValidationError(res, errors);
    return;
  }

  next();
};

export const parseTicketListQuery = (
  query: Record<string, unknown>,
): TicketListQuery => {
  const page = Number(getSingleQueryValue(query.page) ?? DEFAULT_PAGE);
  const limit = Number(getSingleQueryValue(query.limit) ?? DEFAULT_PAGE_SIZE);

  const requesterId =
    getSingleQueryValue(query.requesterId) ?? getSingleQueryValue(query.creatorId);

  return {
    page,
    limit,
    sortBy: getSingleQueryValue(query.sortBy) ?? "createdAt",
    sortOrder: (getSingleQueryValue(query.sortOrder) ?? "desc") as "asc" | "desc",
    search: getSingleQueryValue(query.search),
    status: getSingleQueryValue(query.status) as TicketStatus | undefined,
    priority: getSingleQueryValue(query.priority) as TicketPriority | undefined,
    categoryId: getSingleQueryValue(query.categoryId),
    assigneeId: getSingleQueryValue(query.assigneeId),
    requesterId,
    creatorId: getSingleQueryValue(query.creatorId),
    dateFrom: getSingleQueryValue(query.dateFrom),
    dateTo: getSingleQueryValue(query.dateTo),
    includeCancelled: getSingleQueryValue(query.includeCancelled) === "true",
  };
};