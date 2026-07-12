import { Router } from "express";

import { requireRoles } from "../../middlewares/requireRoles.js";
import { validateRequest } from "../../middlewares/validateRequest.js";

import { ticketController } from "./ticket.controller.js";

import {
  assignTicketBodySchema,
  changeTicketPriorityBodySchema,
  changeTicketStatusBodySchema,
  createTicketBodySchema,
  listTicketsQuerySchema,
  ticketDetailQuerySchema,
  ticketIdParamSchema,
  updateTicketBodySchema,
} from "./ticket.schema.js";

const router = Router();

router.post(
  "/",
  requireRoles(
    "ticket_user",
    "ticket_agent",
    "ticket_manager",
    "ticket_admin",
  ),
  validateRequest({
    body: createTicketBodySchema,
  }),
  ticketController.create,
);

router.get(
  "/",
  validateRequest({
    query: listTicketsQuerySchema,
  }),
  ticketController.list,
);

router.get(
  "/:id",
  validateRequest({
    params: ticketIdParamSchema,
    query: ticketDetailQuerySchema,
  }),
  ticketController.detail,
);

router.patch(
  "/:id",
  validateRequest({
    params: ticketIdParamSchema,
    body: updateTicketBodySchema,
  }),
  ticketController.update,
);

router.patch(
  "/:id/status",
  requireRoles(
    "ticket_agent",
    "ticket_manager",
    "ticket_admin",
  ),
  validateRequest({
    params: ticketIdParamSchema,
    body: changeTicketStatusBodySchema,
  }),
  ticketController.changeStatus,
);

router.patch(
  "/:id/assign",
  requireRoles(
    "ticket_agent",
    "ticket_manager",
    "ticket_admin",
  ),
  validateRequest({
    params: ticketIdParamSchema,
    body: assignTicketBodySchema,
  }),
  ticketController.assign,
);

router.patch(
  "/:id/priority",
  requireRoles(
    "ticket_agent",
    "ticket_manager",
    "ticket_admin",
  ),
  validateRequest({
    params: ticketIdParamSchema,
    body: changeTicketPriorityBodySchema,
  }),
  ticketController.changePriority,
);

router.delete(
  "/:id",
  validateRequest({
    params: ticketIdParamSchema,
  }),
  ticketController.remove,
);

export default router;