import type { Request, Response } from "express";
import {
    commentService,
    CommentServiceError,
} from "./comment.service";
import { USER_ROLES, type UserRole } from "./comment.constants";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import type {
    CommentIdParams,
    CreateCommentInput,
    TicketIdParams,
    UpdateCommentInput,
} from "./comment.schema";

const getValidated = <T>(
    res: Response,
    key: "body" | "params" | "query",
): T => {
    return res.locals.validated?.[key] as T;
};

const getActorId = (req: Request): string | null => {
    const actorId = req.header("x-user-id");

    if(actorId && actorId.trim().length > 0) {
        return actorId;
    }

    return null;
};

const getRole = (req: Request): UserRole => {
    const role = req.header("x-user-role")?.toUpperCase();

    if(
        role === USER_ROLES.AGENT ||
        role === USER_ROLES.ADMIN ||
        role === USER_ROLES.MANAGER
    ){
        return role
    }
    return USER_ROLES.USER

}

const getActorContext = (req: Request) => {
    return {
        actorId: getActorId(req),
        role: getRole(req)
    }
}

const handleError = (error: unknown, res: Response) => {
    if(error instanceof CommentServiceError){
        sendError(res, error.statusCode, error.message);
        return;
    }
    console.log(error);
    sendError(res, 500, "internal server error");
}

export const commentController = {
    async create(req: Request, res: Response) {
        try {
           const params = getValidated<TicketIdParams>(res, "params");
           const body = getValidated<CreateCommentInput>(res, "body");

           const results = await commentService.createComment(
            params.ticketId,
            body,
            getActorContext(req)
           );
           sendSuccess(res, {
            statusCode: 201,
            message: "Comment created Successfully",
            data: results
           })
        } catch (error) {
            handleError(error, res)
        }
    },

    async listByTicket(req: Request, res: Response) {
        try {
            const params = getValidated<TicketIdParams>(res, "params");

            const result = await commentService.listComments(
                params.ticketId,
                getActorContext(req)
            );
            sendSuccess(res, result);
        }catch (error) {
            handleError(error, res)
        }
    },

    async update(req: Request, res: Response) {
        try{
            const params = getValidated<CommentIdParams>(res, "params");
            const body = getValidated<UpdateCommentInput>(res, "body");

            const result = await commentService.updateComment(
                params.commentId,
                body,
                getActorContext(req)
            );

            sendSuccess(res, {
                message: "comment has been updated",
                data: result
            });
        }catch (error){
            handleError(error, res)
        }
    },

    async remove (req: Request, res: Response){
        try{
            const params = getValidated<CommentIdParams>(res, "params");

            const result = await commentService.deleteComment(
                params.commentId,
                getActorContext(req)
            );

            sendSuccess(res, result)
        }catch (error){
            handleError(error, res)
        }
    }
}
