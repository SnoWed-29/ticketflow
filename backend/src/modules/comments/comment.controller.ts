import type { Request, Response } from "express";

import { getAuthenticatedPrincipal } from "../auth/auth-context.js";
import { sendError, sendSuccess } from "../../utils/apiResponse.js";

import {
  commentService,
  CommentServiceError,
} from "./comment.service.js";

import type {
  CommentIdParams,
  CreateCommentInput,
  TicketIdParams,
  UpdateCommentInput,
} from "./comment.schema.js";

const getValidated = <T>(
  response: Response,
  key: "body" | "params" | "query",
): T => {
  return response.locals.validated?.[key] as T;
};

const handleError = (
  error: unknown,
  response: Response,
): void => {
  if (error instanceof CommentServiceError) {
    sendError(
      response,
      error.statusCode,
      error.message,
    );
    return;
  }

  console.error(error);

  sendError(
    response,
    500,
    "Internal server error.",
  );
};

export const commentController = {
  async create(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const body =
        getValidated<CreateCommentInput>(
          response,
          "body",
        );

      const result =
        await commentService.createComment(
          params.ticketId,
          body,
          principal,
        );

      sendSuccess(response, {
        statusCode: 201,
        message: "Comment created successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async listByTicket(
    request: Request,
    response: Response,
  ) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const result =
        await commentService.listComments(
          params.ticketId,
          principal,
        );

      sendSuccess(response, result);
    } catch (error) {
      handleError(error, response);
    }
  },

  async update(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<CommentIdParams>(
          response,
          "params",
        );

      const body =
        getValidated<UpdateCommentInput>(
          response,
          "body",
        );

      const result =
        await commentService.updateComment(
          params.commentId,
          body,
          principal,
        );

      sendSuccess(response, {
        message: "Comment has been updated.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async remove(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<CommentIdParams>(
          response,
          "params",
        );

      const result =
        await commentService.deleteComment(
          params.commentId,
          principal,
        );

      sendSuccess(response, result);
    } catch (error) {
      handleError(error, response);
    }
  },
};