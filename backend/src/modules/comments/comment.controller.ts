import type { Request, Response } from "express";
import {
    commentService,
    CommentServiceError,
} from "./comment.service";
import { USER_ROLES, type UserRole } from "./comment.constants";

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
        res.status(error.statusCode).json({
            message: error.message,
        });
        return;
    }
    console.log(error);
    res.status(500).json({
        message: "internal server error"
    });
}

export const commentController = {
    async create(req: Request, res: Response) {
        try {
           const results = await commentService.createComment(
            String(req.params.ticketId),
            req.body,
            getActorContext(req)
           );
           res.status(201).json({
            message: "Comment created Successfully",
            data: results
           })
        } catch (error) {
            handleError(error, res)
        }
    },

    async listByTicket(req: Request, res: Response) {
        try {
            const result = await commentService.listComments(
                String(req.params.ticketId),
                getActorContext(req)
            );
            res.status(200).json(result);
        }catch (error) {
            handleError(error, res)
        }
    },

    async update(req: Request, res: Response) {
        try{
            const result = await commentService.updateComment(
                String(req.params.commentId), 
                req.body,
                getActorContext(req)
            );

            res.status(200).json({
                message: "comment has been updated",
                data: result
            });
        }catch (error){
            handleError(error, res)
        }
    },

    async remove (req: Request, res: Response){
        try{
            const result = await commentService.deleteComment(
                String(req.params.commentId),
                getActorContext(req)
            );

            res.status(200).json(result)
        }catch (error){
            handleError(error, res)
        }
    }
}
