import type { Request, Response } from "express";
import { ticketService, TicketServiceError } from "./ticket.service.js";
import { parseTicketListQuery } from "./ticket.validator.js";

const getActorId = (req: Request): string | null => {
  const headerActorId = req.header("x-user-id");

  if (headerActorId && headerActorId.trim().length > 0) {
    return headerActorId;
  }

  return null;
};

const getDetailIncludeOptions = (req: Request) => {
  const includeRaw = String(req.query.include ?? "");
  const includes = includeRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    includeComments: includes.includes("comments"),
    includeEvents: includes.includes("events"),
  };
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof TicketServiceError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: "Internal server error.",
  });
};

export const ticketController = {
  async create(req: Request, res: Response) {
    try {
      const result = await ticketService.createTicket(req.body, {
        actorId: getActorId(req),
      });

      res.status(201).json({
        message: "Ticket created successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const query = parseTicketListQuery(req.query);
      const result = await ticketService.listTickets(query);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, res);
    }
  },

  async detail(req: Request, res: Response) {
    try {
      const result = await ticketService.getTicketById(
        String(req.params.id),
        getDetailIncludeOptions(req),
      );

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const result = await ticketService.updateTicket(String(req.params.id), req.body, {
        actorId: getActorId(req),
      });

      res.status(200).json({
        message: "Ticket updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async changeStatus(req: Request, res: Response) {
    try {
      const result = await ticketService.changeStatus(String(req.params.id), req.body, {
        actorId: getActorId(req),
      });

      res.status(200).json({
        message: "Ticket status updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async assign(req: Request, res: Response) {
    try {
      const result = await ticketService.assignTicket(String(req.params.id), req.body, {
        actorId: getActorId(req),
      });

      res.status(200).json({
        message: "Ticket assignment updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async changePriority(req: Request, res: Response) {
    try {
      const result = await ticketService.changePriority(String(req.params.id), req.body, {
        actorId: getActorId(req),
      });

      res.status(200).json({
        message: "Ticket priority updated successfully.",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const result = await ticketService.deleteTicket(String(req.params.id), {
        actorId: getActorId(req),
      });

      res.status(200).json(result);
    } catch (error) {
      handleError(error, res);
    }
  },
};