import type { AuthenticatedPrincipal } from "../auth/auth.types.js";

import { invalidateCategoryCache } from "../../utils/cache/cache-invalidation.js";
import { canManageCategories } from "./category.authorization.js";
import { getCachedActiveCategories } from "./category.cache.js";
import { categoryRepository } from "./category.repository.js";
import type {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";
import { categorySerializer } from "./category.serializer.js";

export class CategoryServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function ensureCategoryExists<T>(
  category: T | null | undefined,
): asserts category is NonNullable<T> {
  if (!category) {
    throw new CategoryServiceError(
      404,
      "Category not found.",
    );
  }
}

function ensureCanManageCategories(
  principal: AuthenticatedPrincipal,
): void {
  if (!canManageCategories(principal)) {
    throw new CategoryServiceError(
      403,
      "You cannot manage categories.",
    );
  }
}

async function ensureUniqueCategory(
  name: string | undefined,
  slug: string | undefined,
  excludeId?: string,
): Promise<void> {
  const conflict = await categoryRepository.findConflict(
    name,
    slug,
    excludeId,
  );

  if (!conflict) return;

  const field =
    name && conflict.name.toLowerCase() === name.toLowerCase()
      ? "name"
      : "slug";

  throw new CategoryServiceError(
    409,
    `A category with this ${field} already exists.`,
  );
}

export const categoryService = {
  async listCategories(
    query: CategoryListQuery,
    principal: AuthenticatedPrincipal,
  ) {
    if (query.includeInactive) {
      if (!canManageCategories(principal)) {
        throw new CategoryServiceError(
          403,
          "You cannot view inactive categories.",
        );
      }

      const categories = await categoryRepository.findMany(true);
      return categorySerializer.list(categories);
    }

    return getCachedActiveCategories();
  },

  async getCategoryById(
    id: string,
    principal: AuthenticatedPrincipal,
  ) {
    const category = await categoryRepository.findById(id);
    ensureCategoryExists(category);

    if (
      !category.isActive &&
      !canManageCategories(principal)
    ) {
      throw new CategoryServiceError(
        404,
        "Category not found.",
      );
    }

    return categorySerializer.item(category);
  },

  async createCategory(
    input: CreateCategoryInput,
    principal: AuthenticatedPrincipal,
  ) {
    ensureCanManageCategories(principal);
    await ensureUniqueCategory(input.name, input.slug);
    const category = await categoryRepository.create(input);
    await invalidateCategoryCache();
    return categorySerializer.item(category);
  },

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    principal: AuthenticatedPrincipal,
  ) {
    ensureCanManageCategories(principal);
    ensureCategoryExists(
      await categoryRepository.findById(id),
    );
    await ensureUniqueCategory(
      input.name,
      input.slug,
      id,
    );

    const category = await categoryRepository.update(id, input);
    await invalidateCategoryCache();
    return categorySerializer.item(category);
  },

  async deactivateCategory(
    id: string,
    principal: AuthenticatedPrincipal,
  ) {
    ensureCanManageCategories(principal);
    const existing = await categoryRepository.findById(id);
    ensureCategoryExists(existing);

    const category = existing.isActive
      ? await categoryRepository.deactivate(id)
      : existing;

    if (existing.isActive) {
      await invalidateCategoryCache();
    }

    return categorySerializer.item(category);
  },
};
