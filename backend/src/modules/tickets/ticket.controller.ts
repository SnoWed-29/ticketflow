import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { ticketService, TicketServiceError } from "./ticket.service";
import type {
  AssignTicketInput,
  ChangePriorityInput,
  ChangeStatusInput,
  CreateTicketInput,
  TicketDetailQuery,
  TicketIdParams,
  TicketListQuery,
  UpdateTicketInput,
} from "./ticket.schema";
import type { TicketSerializerRole } from "./ticket.serializer";

const getValidated = <T>(
  res: Response,
  key: "body" | "params" | "query",
): T => {
  return res.locals.validated?.[key] as T;
};

const getActorId = (req: Request): string | null => {
  const actorId = req.header("x-user-id");

  if (actorId && actorId.trim().length > 0) {
    return actorId;
  }

  return null;
};

const getRole = (req: Request): TicketSerializerRole => {
  const role = req.header("x-user-role")?.toUpperCase();

  if (
    role === "AGENT" ||
    role === "MANAGER" ||
    role === "ADMIN"
  ) {
    return role;
  }

  return "USER";
};

const getActorContext = (req: Request) => {
  return {
    actorId: getActorId(req),
    role: getRole(req),
  };
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof TicketServiceError) {
    sendError(res, error.statusCode, error.message);
    return;
  }

  console.error(error);

  sendError(res, 500, "Internal server error.");
};

export const ticketController = {
  async create(req: Request, res: Response) {
    try {
      const body = getValidated<CreateTicketInput>(res, "body");

      const result = await ticketService.createTicket(
        body,
        getActorContext(req),
      );

      sendSuccess(res, {
        statusCode: 201,
        message: "Ticket created successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const query = getValidated<TicketListQuery>(res, "query");

      const result = await ticketService.listTickets(
        query,
        getActorContext(req),
      );

      sendSuccess(res, {
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async detail(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");
      const query = getValidated<TicketDetailQuery>(res, "query");

      const result = await ticketService.getTicketById(
        params.id,
        query,
        getActorContext(req),
      );

      sendSuccess(res, {
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");
      const body = getValidated<UpdateTicketInput>(res, "body");

      const result = await ticketService.updateTicket(
        params.id,
        body,
        getActorContext(req),
      );

      sendSuccess(res, {
        message: "Ticket updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async changeStatus(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");
      const body = getValidated<ChangeStatusInput>(res, "body");

      const result = await ticketService.changeStatus(
        params.id,
        body,
        getActorContext(req),
      );

      sendSuccess(res, {
        message: "Ticket status updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async assign(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");
      const body = getValidated<AssignTicketInput>(res, "body");

      const result = await ticketService.assignTicket(
        params.id,
        body,
        getActorContext(req),
      );

      sendSuccess(res, {
        message: "Ticket assignment updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async changePriority(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");
      const body = getValidated<ChangePriorityInput>(res, "body");

      const result = await ticketService.changePriority(
        params.id,
        body,
        getActorContext(req),
      );

      sendSuccess(res, {
        message: "Ticket priority updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const params = getValidated<TicketIdParams>(res, "params");

      const result = await ticketService.deleteTicket(
        params.id,
        getActorContext(req),
      );

      sendSuccess(res, {
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
};