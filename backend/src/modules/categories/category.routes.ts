import { Router } from "express";

import { requireRoles } from "../../middlewares/requireRoles.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { categoryController } from "./category.controller.js";
import {
  categoryIdParamSchema,
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema,
} from "./category.schema.js";

const router = Router();

router.get(
  "/",
  validateRequest({ query: listCategoriesQuerySchema }),
  categoryController.list,
);

router.post(
  "/",
  requireRoles("ticket_manager", "ticket_admin"),
  validateRequest({ body: createCategoryBodySchema }),
  categoryController.create,
);

router.get(
  "/:id",
  validateRequest({ params: categoryIdParamSchema }),
  categoryController.detail,
);

router.patch(
  "/:id",
  requireRoles("ticket_manager", "ticket_admin"),
  validateRequest({
    params: categoryIdParamSchema,
    body: updateCategoryBodySchema,
  }),
  categoryController.update,
);

router.delete(
  "/:id",
  requireRoles("ticket_manager", "ticket_admin"),
  validateRequest({ params: categoryIdParamSchema }),
  categoryController.remove,
);

export default router;
