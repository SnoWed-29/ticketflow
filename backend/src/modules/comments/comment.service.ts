import {
    SUPPORT_ROLES,
    USER_ROLES,
    type UserRole
}  from "./comment.constants";
import { commentHook } from "./comment.hooks";
import { commentRepository } from "./comment.repository";
import { commentSerializer } from "./comment.serializer";
import type {
    CreateCommentInput,
    UpdateCommentInput,
} from "./comment.schema";
import { writeTicketEvent } from "../tickets/ticket-event.writer";
import { TICKET_EVENT_TYPES } from "../tickets/ticket.constants";

export class CommentServiceError extends Error {
    statusCode: number;

    constructor(statusCode: number,message: string){
        super(message);
        this.statusCode = statusCode;
    }
}

type ActorContext = {
    actorId?: string | null;
    role: UserRole;
}

const isSupportRole = (role: UserRole): boolean => {
    return SUPPORT_ROLES.includes(role as any);
}

const canManageAnyComment = (role: UserRole): boolean => {
    return role === USER_ROLES.MANAGER || role === USER_ROLES.ADMIN;
}

const ensureActor = (context: ActorContext): string => {
    if (!context.actorId){
        throw new CommentServiceError(
            400,
            "x-user-id is required until auth is implemented"
        );
    }
    return context.actorId;
}

const ensureTicketVisibleToActor = (ticket: any,context: ActorContext) => {
    if(!ticket){
        throw new CommentServiceError(404, "ticket not found")
    }

    if(isSupportRole(context.role)){
        return;
    }

    if(ticket.requesterId !== context.actorId) {
        throw new CommentServiceError(403, "you cannot access this ticket")
    }
}

const ensureCommentVisibleToActor = (comment: any, context: ActorContext) => {
    if(!comment){
        throw new CommentServiceError(404, "comment not found")
    }

    ensureTicketVisibleToActor(comment.ticket, context)

    if(comment.isInternalNote && !isSupportRole(context.role)){
        throw new CommentServiceError(404, "comment not found")
    }
}

const ensureCanEditOrDeleteComment = (comment: any, context:ActorContext) => {
    ensureCommentVisibleToActor(comment, context);

    if(canManageAnyComment(context.role)) {
        return;
    }

    if(comment.authorId === context.actorId){
        return;
    }

    throw new CommentServiceError(
        403, 
        "you are not allowed to edit or delete this comment"
    );
}

export const commentService = {
    async createComment(
        ticketId: string,
        input: CreateCommentInput,
        context: ActorContext
    ) {
        const actorId = ensureActor(context);
        const ticket = await commentRepository.findTicketById(ticketId)

        ensureTicketVisibleToActor(ticket, context);

        const isInternalNote = input.isInternalNote ?? false;

        if(isInternalNote && !isSupportRole(context.role)) {
            throw new CommentServiceError(
                403,
                "Only agents, managers, and admins can add internal notes.",
            );
        }
        
        const comment = await commentRepository.create({
            ticketId,
            authorId: actorId,
            content: input.content,
            isInternalNote
        });

        await writeTicketEvent({
            ticketId,
            type: TICKET_EVENT_TYPES.COMMENT_ADDED,
            actorId,
            metadata: {
                commentId: comment.id,
                isInternalNote,
            }
        });

        await commentHook.afterCommentCreated({
            ticketId,
            commentId: comment.id,
            actorId,
            isInternalNote,
        });

        return commentSerializer.item(comment, {
            includeInternalFlag: isSupportRole(context.role)
        });
    },

    async listComments(ticketId: string,context: ActorContext) {
        ensureActor(context);

        const ticket = await commentRepository.findTicketById(ticketId);
        ensureTicketVisibleToActor(ticket, context)

        const includeInternalNotes = isSupportRole(context.role)

        const comments = await commentRepository.findManyByTicket({
            ticketId,
            includeInternalNotes,
        });

        return commentSerializer.list(comments, {
            includeInternalFlag: includeInternalNotes,
        })
    },

    async updateComment(
        commentId: string,
        input: UpdateCommentInput,
        context: ActorContext
    ) {
        const comment = await commentRepository.findById(commentId)
        const actorId = ensureActor(context);
        ensureCanEditOrDeleteComment(comment, context)

        const updatedComment = await commentRepository.update(commentId, input);

        await commentHook.afterCommentUpdated({
            ticketId: updatedComment.ticketId,
            commentId: commentId,
            actorId,
            isInternalNote: updatedComment.isInternalNote
        });

        return commentSerializer.item(updatedComment, {
            includeInternalFlag: isSupportRole(context.role)
        })
    },

    async deleteComment(commentId: string, context: ActorContext) {
        const actorId = ensureActor(context);
        const comment = await commentRepository.findById(commentId)
        ensureCanEditOrDeleteComment(comment, context)

        const deletedComment = await commentRepository.softDelete(commentId)

        await commentHook.afterCommentDeleted({
            ticketId: deletedComment.ticketId,
            commentId: deletedComment.id,
            actorId,
            isInternalNote: deletedComment.isInternalNote
        });

        return {
            message: "Comment deleted successfully",
        };
    }
}
