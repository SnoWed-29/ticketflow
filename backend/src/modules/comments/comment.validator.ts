import type { RequestHandler, Response } from "express";

export type CreateCommentInput = {
  content: string;
  isInternalNote?: boolean;
};

export type UpdateCommentInput = {
  content: string;
};

const sendValidationError = (res: Response, errors: string[]) => {
  res.status(400).json({
    message: "Validation failed",
    errors,
  });
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const validateTicketIdParam: RequestHandler = (req, res, next) => {
  if (!isNonEmptyString(req.params.ticketId)) {
    sendValidationError(res, ["ticketId is required."]);
    return;
  }

  next();
};

export const validateCommentIdParam: RequestHandler = (req, res, next) => {
  if (!isNonEmptyString(req.params.commentId)) {
    sendValidationError(res, ["commentId is required."]);
    return;
  }

  next();
};

export const validateCreateCommentBody: RequestHandler = (req, res, next) => {
  const errors: string[] = [];
  const body = req.body as CreateCommentInput;

  if (!isNonEmptyString(body.content)) {
    errors.push("content is required.");
  }

  if (
    body.isInternalNote !== undefined &&
    typeof body.isInternalNote !== "boolean"
  ) {
    errors.push("isInternalNote must be a boolean.");
  }

  if (errors.length > 0) {
    sendValidationError(res, errors);
    return;
  }

  next();
};

export const validateUpdateCommentBody: RequestHandler = (req, res, next) => {
  const body = req.body as UpdateCommentInput;

  if (!isNonEmptyString(body.content)) {
    sendValidationError(res, ["content is required."]);
    return;
  }

  next();
};