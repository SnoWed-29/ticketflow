import type { Request, Response } from "express";

import { getAuthenticatedPrincipal } from "../auth/auth-context.js";
import { sendError, sendSuccess } from "../../utils/apiResponse.js";
import {
  categoryService,
  CategoryServiceError,
} from "./category.service.js";
import type {
  CategoryIdParams,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";

const getValidated = <T>(
  response: Response,
  key: "body" | "params" | "query",
): T => response.locals.validated?.[key] as T;

const handleError = (
  error: unknown,
  response: Response,
): void => {
  if (error instanceof CategoryServiceError) {
    sendError(response, error.statusCode, error.message);
    return;
  }

  console.error(error);
  sendError(response, 500, "Internal server error.");
};

export const categoryController = {
  async list(request: Request, response: Response) {
    try {
      const principal = getAuthenticatedPrincipal(request);
      const query = getValidated<CategoryListQuery>(
        response,
        "query",
      );
      const categories = await categoryService.listCategories(
        query,
        principal,
      );
      sendSuccess(response, { data: categories });
    } catch (error) {
      handleError(error, response);
    }
  },

  async detail(request: Request, response: Response) {
    try {
      const principal = getAuthenticatedPrincipal(request);
      const { id } = getValidated<CategoryIdParams>(
        response,
        "params",
      );
      const category = await categoryService.getCategoryById(
        id,
        principal,
      );
      sendSuccess(response, { data: category });
    } catch (error) {
      handleError(error, response);
    }
  },

  async create(request: Request, response: Response) {
    try {
      const principal = getAuthenticatedPrincipal(request);
      const body = getValidated<CreateCategoryInput>(
        response,
        "body",
      );
      const category = await categoryService.createCategory(
        body,
        principal,
      );
      sendSuccess(response, {
        statusCode: 201,
        message: "Category created successfully.",
        data: category,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async update(request: Request, response: Response) {
    try {
      const principal = getAuthenticatedPrincipal(request);
      const { id } = getValidated<CategoryIdParams>(
        response,
        "params",
      );
      const body = getValidated<UpdateCategoryInput>(
        response,
        "body",
      );
      const category = await categoryService.updateCategory(
        id,
        body,
        principal,
      );
      sendSuccess(response, {
        message: "Category updated successfully.",
        data: category,
      });
    } catch (error) {
      handleError(error, response);
    }
  },

  async remove(request: Request, response: Response) {
    try {
      const principal = getAuthenticatedPrincipal(request);
      const { id } = getValidated<CategoryIdParams>(
        response,
        "params",
      );
      const category = await categoryService.deactivateCategory(
        id,
        principal,
      );
      sendSuccess(response, {
        message: "Category deactivated successfully.",
        data: category,
      });
    } catch (error) {
      handleError(error, response);
    }
  },
};
