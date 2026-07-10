import type { AuthenticatedPrincipal } from "../modules/auth";

declare global {
    namespace Express {
        interface Request {
            auth?: AuthenticatedPrincipal;
        }
    }
}

export {};