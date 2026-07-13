import type { Request, Response } from "express";

import { getAuthenticatedPrincipal } from "../auth/auth-context.js";
import { sendError, sendSuccess } from "../../utils/apiResponse.js";

import {
  ticketService,
  TicketServiceError,
} from "./ticket.service.js";
import { isSupportStaff } from "./ticket.authorization.js";
import { getCachedTicketCounts } from "./ticket-stats.cache.js";

import type {
  AssignTicketInput,
  ChangePriorityInput,
  ChangeStatusInput,
  CreateTicketInput,
  TicketDetailQuery,
  TicketIdParams,
  TicketListQuery,
  UpdateTicketInput,
} from "./ticket.schema.js";

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
  if (error instanceof TicketServiceError) {
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

export const ticketController = {
  async stats(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);
      const supportStaff = isSupportStaff(principal);
      const scopeKey = supportStaff
        ? "global"
        : `requester:${principal.subject}`;

      const result = await getCachedTicketCounts(
        scopeKey,
        supportStaff ? undefined : principal.subject,
      );

      sendSuccess(response, { data: result });
    } catch (error) {
      handleError(error, response);
    }
  },

  async create(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const body =
        getValidated<CreateTicketInput>(
          response,
          "body",
        );

      const result =
        await ticketService.createTicket(
          body,
          principal,
        );

      sendSuccess(response, {
        statusCode: 201,
        message: "Ticket created successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async list(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const query =
        getValidated<TicketListQuery>(
          response,
          "query",
        );

      const result =
        await ticketService.listTickets(
          query,
          principal,
        );

      sendSuccess(response, {
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async detail(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const query =
        getValidated<TicketDetailQuery>(
          response,
          "query",
        );

      const result =
        await ticketService.getTicketById(
          params.id,
          query,
          principal,
        );

      sendSuccess(response, {
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async update(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const body =
        getValidated<UpdateTicketInput>(
          response,
          "body",
        );

      const result =
        await ticketService.updateTicket(
          params.id,
          body,
          principal,
        );

      sendSuccess(response, {
        message: "Ticket updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async changeStatus(
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

      const body =
        getValidated<ChangeStatusInput>(
          response,
          "body",
        );

      const result =
        await ticketService.changeStatus(
          params.id,
          body,
          principal,
        );

      sendSuccess(response, {
        message: "Ticket status updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async assign(request: Request, response: Response) {
    try {
      const principal =
        getAuthenticatedPrincipal(request);

      const params =
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const body =
        getValidated<AssignTicketInput>(
          response,
          "body",
        );

      const result =
        await ticketService.assignTicket(
          params.id,
          body,
          principal,
        );

      sendSuccess(response, {
        message:
          "Ticket assignment updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async changePriority(
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

      const body =
        getValidated<ChangePriorityInput>(
          response,
          "body",
        );

      const result =
        await ticketService.changePriority(
          params.id,
          body,
          principal,
        );

      sendSuccess(response, {
        message:
          "Ticket priority updated successfully.",
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
        getValidated<TicketIdParams>(
          response,
          "params",
        );

      const result =
        await ticketService.deleteTicket(
          params.id,
          principal,
        );

      sendSuccess(response, {
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      handleError(error, response);
    }
  },
};
