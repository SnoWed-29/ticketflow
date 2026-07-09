import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID.");

const contentSchema = z
  .string()
  .trim()
  .min(1, "content is required.")
  .max(10000, "content is too long.");

export const ticketIdParamSchema = z
  .object({
    ticketId: uuidSchema,
  })
  .strict();

export const commentIdParamSchema = z
  .object({
    commentId: uuidSchema,
  })
  .strict();

export const createCommentBodySchema = z
  .object({
    content: contentSchema,
    isInternalNote: z.boolean().optional().default(false),
  })
  .strict();

export const updateCommentBodySchema = z
  .object({
    content: contentSchema,
  })
  .strict();

export type TicketIdParams = z.infer<typeof ticketIdParamSchema>;
export type CommentIdParams = z.infer<typeof commentIdParamSchema>;
export type CreateCommentInput = z.infer<typeof createCommentBodySchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentBodySchema>;
