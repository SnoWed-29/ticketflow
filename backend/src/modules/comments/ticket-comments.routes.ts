import Router from "express";
import { commentController } from "./comment.controller";
import {
    validateCreateCommentBody,
    validateTicketIdParam
} from "./comment.validator";

const router = Router();

router.post("/:ticketId/comments",
    validateTicketIdParam,
    validateCreateCommentBody,
    commentController.create
)

router.get("/:ticketId/comments",
    validateTicketIdParam,
    commentController.listByTicket
)

export default router;