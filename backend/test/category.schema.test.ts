import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema,
} from "../src/modules/categories/category.schema.js";

test("create category trims values and applies defaults", () => {
  const result = createCategoryBodySchema.parse({
    name: "  IT Support  ",
    slug: "it-support",
  });

  assert.deepEqual(result, {
    name: "IT Support",
    slug: "it-support",
    isActive: true,
  });
});

test("category slug must be lowercase kebab-case", () => {
  const result = createCategoryBodySchema.safeParse({
    name: "IT Support",
    slug: "IT Support",
  });

  assert.equal(result.success, false);
});

test("category update rejects an empty body", () => {
  const result = updateCategoryBodySchema.safeParse({});
  assert.equal(result.success, false);
});

test("includeInactive parses explicit boolean query values", () => {
  assert.equal(
    listCategoriesQuerySchema.parse({
      includeInactive: "true",
    }).includeInactive,
    true,
  );
  assert.equal(
    listCategoriesQuerySchema.parse({}).includeInactive,
    false,
  );
});
