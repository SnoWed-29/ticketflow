import { Router } from "express";
import { ticketController } from "./ticket.controller.js";
import {
  validateAssignTicketBody,
  validateChangePriorityBody,
  validateChangeStatusBody,
  validateCreateTicketBody,
  validateListTicketsQuery,
  validateTicketId,
  validateUpdateTicketBody,
} from "./ticket.validator.js";

const router = Router();

router.post(
  "/",
  validateCreateTicketBody,
  ticketController.create,
);

router.get(
  "/",
  validateListTicketsQuery,
  ticketController.list,
);

router.get(
  "/:id",
  validateTicketId,
  ticketController.detail,
);

router.patch(
  "/:id",
  validateTicketId,
  validateUpdateTicketBody,
  ticketController.update,
);

router.patch(
  "/:id/status",
  validateTicketId,
  validateChangeStatusBody,
  ticketController.changeStatus,
);

router.patch(
  "/:id/assign",
  validateTicketId,
  validateAssignTicketBody,
  ticketController.assign,
);

router.patch(
  "/:id/priority",
  validateTicketId,
  validateChangePriorityBody,
  ticketController.changePriority,
);

router.delete(
  "/:id",
  validateTicketId,
  ticketController.remove,
);

export default router;