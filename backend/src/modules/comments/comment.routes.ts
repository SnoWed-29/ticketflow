import { Router } from "express";
import { commentController } from "./comment.controller";
import {
  validateCommentIdParam,
  validateUpdateCommentBody,
} from "./comment.validator";

const router = Router();

router.patch(
  "/:commentId",
  validateCommentIdParam,
  validateUpdateCommentBody,
  commentController.update,
);

router.delete(
  "/:commentId",
  validateCommentIdParam,
  commentController.remove,
);

export default router;