import { prisma } from "../../db/prisma";
import type {
    CreateCommentInput,
    UpdateCommentInput,
} from "./comment.schema";

export const commentRepository = {
    async findTicketById(ticketId: string) {
        return prisma.ticket.findFirst({
            where: {
                id: ticketId,
                status:{
                    not: "CANCELLED",
                },
            },
        });
    },

    async create(input: CreateCommentInput & {
        ticketId: string,
        authorId: string,
        isInternalNote: boolean
    }) {
        return prisma.comment.create({
            data:{
                ticketId: input.ticketId,
                authorId: input.authorId,
                content: input.content,
                isInternalNote: input.isInternalNote
            },
        });
    },

    async findManyByTicket(input: {
        ticketId: string,
        includeInternalNotes: boolean
    }){
        return prisma.comment.findMany({
            where: {
                ticketId: input.ticketId,
                deletedAt: null,
                ...(input.includeInternalNotes
                    ? {}
                    : {
                        isInternalNote: false,
                    }),
            },
            orderBy: {
                createdAt: "asc"
            },
        })
    },

    async findById(commentId: string){
        return prisma.comment.findFirst({
            where: {
                id: commentId,
                deletedAt: null,
            },
            include: {
                ticket: true,
            },
        });
    },

    async update(commentId: string,input: UpdateCommentInput){
        return prisma.comment.update({
            where: {
                id: commentId
            },
            data: {
                content: input.content.trim()
            },
        });
    },

    async softDelete(commentId: string){
        return prisma.comment.update({
            where: {
                id: commentId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
};
