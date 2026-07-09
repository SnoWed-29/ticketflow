import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { commentController } from "./comment.controller.js";
import {
  commentIdParamSchema,
  updateCommentBodySchema,
} from "./comment.schema.js";

const router = Router();

router.patch(
  "/:commentId",
  validateRequest({
    params: commentIdParamSchema,
    body: updateCommentBodySchema,
  }),
  commentController.update,
);

router.delete(
  "/:commentId",
  validateRequest({
    params: commentIdParamSchema,
  }),
  commentController.remove,
);

export default router;
