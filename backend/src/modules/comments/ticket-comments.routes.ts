import Router from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { commentController } from "./comment.controller.js";
import {
    createCommentBodySchema,
    ticketIdParamSchema,
} from "./comment.schema.js";

const router = Router();

router.post("/:ticketId/comments",
    validateRequest({
        params: ticketIdParamSchema,
        body: createCommentBodySchema,
    }),
    commentController.create
)

router.get("/:ticketId/comments",
    validateRequest({
        params: ticketIdParamSchema,
    }),
    commentController.listByTicket
)

export default router;
