import type { Request } from "express";

import type { AuthenticatedPrincipal } from "./auth.types";

export type AuthenticatedRequest = Request & {
    auth: AuthenticatedPrincipal;
}

export function isAuthenticatedRequest (
    request: Request,
): request is AuthenticatedRequest {
    return request.auth !== undefined;
}



export function getAuthenticatedPrincipal (
    request: Request
): AuthenticatedPrincipal {
    if(!request.auth){
        throw new Error(
            "Authenticated principal is unavailable. " +
            "Ensure the authentication middleware runs before this handler.", 
        );
    }
    
    return request.auth;
}