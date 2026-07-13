import { prisma } from "../../db/prisma.js";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";

export const categoryRepository = {
  async findMany(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive
        ? undefined
        : { isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  async findConflict(
    name: string | undefined,
    slug: string | undefined,
    excludeId?: string,
  ) {
    const conflicts = [
      name
        ? { name: { equals: name, mode: "insensitive" as const } }
        : undefined,
      slug
        ? { slug: { equals: slug, mode: "insensitive" as const } }
        : undefined,
    ].filter((value) => value !== undefined);

    if (conflicts.length === 0) return null;

    return prisma.category.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: conflicts,
      },
    });
  },

  async create(input: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        isActive: input.isActive,
      },
    });
  },

  async update(id: string, input: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data: input,
    });
  },

  async deactivate(id: string) {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
