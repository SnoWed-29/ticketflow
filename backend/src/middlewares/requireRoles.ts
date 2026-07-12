import type {
    NextFunction,
    Request,
    RequestHandler,
    Response
} from "express";

import type { TicketRole } from "../modules/auth";

export function requireRoles (
    ...allowedRoles: TicketRole[]
): RequestHandler {
    return (
        request: Request,
        response: Response,
        next: NextFunction, 
    ) : void => {
        const principal = request.auth;

        if(!principal) {
            response.status(401).json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication is required.",
                },
            });
            return
        }

        const isAllowed = allowedRoles.some((role) =>
            principal.roles.includes(role),
        );

        if(!isAllowed) {
            response.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You do not have permission to perform this action.",
                }
            });
            return;
        }
        next();
    };
}