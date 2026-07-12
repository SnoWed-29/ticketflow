import { Router } from "express";

import { getAuthenticatedPrincipal } from "./auth-context";

export const authRouter = Router();

authRouter.get("/auth/me", (req, res) => {
    const principal = getAuthenticatedPrincipal(req);

    res.status(200).json({
        data: principal
    });
})