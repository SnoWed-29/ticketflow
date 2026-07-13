import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(100, "Name must contain at most 100 characters.");

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must contain at least 2 characters.")
  .max(100, "Slug must contain at most 100 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must use lowercase letters, numbers, and single hyphens.",
  );

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Description must contain at most 1000 characters.")
  .nullable();

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const categoryIdParamSchema = z
  .object({ id: uuidSchema })
  .strict();

export const listCategoriesQuerySchema = z
  .object({
    includeInactive: booleanQuerySchema,
  })
  .strict();

export const createCategoryBodySchema = z
  .object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionSchema.optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateCategoryBodySchema = z
  .object({
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
    description: descriptionSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some(
      (field) => field !== undefined,
    ),
    {
      message: "At least one updatable field is required.",
    },
  );

export type CategoryIdParams = z.infer<
  typeof categoryIdParamSchema
>;
export type CategoryListQuery = z.infer<
  typeof listCategoriesQuerySchema
>;
export type CreateCategoryInput = z.infer<
  typeof createCategoryBodySchema
>;
export type UpdateCategoryInput = z.infer<
  typeof updateCategoryBodySchema
>;
