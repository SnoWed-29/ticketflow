import { z } from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  TICKET_LIST_SORT_FIELDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "./ticket.constants";

const emptyStringToUndefined = (value: unknown) => {
    if ( typeof value === "string" && value.trim() === "") {
        return undefined;
    }

    return value
};

const userIdSchema = z
    .string()
    .trim()
    .min(1, "User id is required.");

const uuidSchema = z
  .string()
  .uuid("Must be a valid UUID.");

const optionalUserIdSchema = z.preprocess(
  emptyStringToUndefined,
  userIdSchema.optional(),
);

const optionalUuidSchema = z.preprocess(
  emptyStringToUndefined,
  uuidSchema.optional(),
);

const optionalDateStringSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Must be a valid date.",
    })
    .optional(),
);

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const ticketIdParamSchema = z.object({
  id: uuidSchema,
});

export const createTicketBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must contain at least 3 characters.")
      .max(150, "Title must contain at most 150 characters."),

    description: z
      .string()
      .trim()
      .min(5, "Description must contain at least 5 characters.")
      .max(10000, "Description is too long."),

    priority: z
      .enum(TICKET_PRIORITIES)
      .default("MEDIUM"),

    categoryId: uuidSchema,

    requesterId: userIdSchema.optional(),

    assigneeId: userIdSchema.nullable().optional(),
  })
  .strict();

export const updateTicketBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must contain at least 3 characters.")
      .max(150, "Title must contain at most 150 characters.")
      .optional(),

    description: z
      .string()
      .trim()
      .min(5, "Description must contain at least 5 characters.")
      .max(10000, "Description is too long.")
      .nullable()
      .optional(),

    categoryId: uuidSchema.nullable().optional(),

    assigneeId: userIdSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.categoryId !== undefined ||
      value.assigneeId !== undefined,
    {
      message: "At least one updatable field is required.",
    },
  );

export const changeTicketStatusBodySchema = z
  .object({
    status: z.enum(TICKET_STATUSES),
  })
  .strict();

export const assignTicketBodySchema = z
  .object({
    assigneeId: userIdSchema.nullable(),
  })
  .strict();

export const changeTicketPriorityBodySchema = z
  .object({
    priority: z.enum(TICKET_PRIORITIES),
  })
  .strict();

export const ticketDetailQuerySchema = z
  .object({
    include: z
      .preprocess(
        emptyStringToUndefined,
        z.string().trim().optional(),
      ),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.include) return;

    const allowedIncludes = ["comments", "events"];
    const includes = value.include
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const invalidIncludes = includes.filter(
      (item) => !allowedIncludes.includes(item),
    );

    if (invalidIncludes.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["include"],
        message: `Invalid include value(s): ${invalidIncludes.join(", ")}.`,
      });
    }
  })
  .transform((value) => {
    const includes = value.include
      ? value.include
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    return {
      includeComments: includes.includes("comments"),
      includeEvents: includes.includes("events"),
    };
  });

export const listTicketsQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int("page must be an integer.")
      .min(1, "page must be greater than or equal to 1.")
      .default(DEFAULT_PAGE),

    limit: z.coerce
      .number()
      .int("limit must be an integer.")
      .min(1, "limit must be greater than or equal to 1.")
      .max(MAX_PAGE_SIZE, `limit must be at most ${MAX_PAGE_SIZE}.`)
      .default(DEFAULT_PAGE_SIZE),

    sortBy: z
      .enum(TICKET_LIST_SORT_FIELDS)
      .default("createdAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),

    search: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(150).optional(),
    ),

    status: z
      .enum(TICKET_STATUSES)
      .optional(),

    priority: z
      .enum(TICKET_PRIORITIES)
      .optional(),

    categoryId: optionalUuidSchema,

    assigneeId: optionalUserIdSchema,

    requesterId: optionalUserIdSchema,

    creatorId: optionalUserIdSchema,

    dateFrom: optionalDateStringSchema,

    dateTo: optionalDateStringSchema,

    includeCancelled: booleanQuerySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.dateFrom || !value.dateTo) return;

    const from = new Date(value.dateFrom);
    const to = new Date(value.dateTo);

    if (from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "dateFrom must be before or equal to dateTo.",
      });
    }
  })
  .transform((value) => {
    const { creatorId, ...query } = value;

    return {
      ...query,
      requesterId: value.requesterId ?? creatorId,
    };
  });

export type TicketIdParams = z.infer<typeof ticketIdParamSchema>;
export type CreateTicketInput = z.infer<typeof createTicketBodySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketBodySchema>;
export type ChangeStatusInput = z.infer<typeof changeTicketStatusBodySchema>;
export type AssignTicketInput = z.infer<typeof assignTicketBodySchema>;
export type ChangePriorityInput = z.infer<typeof changeTicketPriorityBodySchema>;
export type TicketDetailQuery = z.infer<typeof ticketDetailQuerySchema>;
export type TicketListQuery = z.infer<typeof listTicketsQuerySchema>;