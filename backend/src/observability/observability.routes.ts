import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "ticketflow-backend",
        timestamp: new Date().toISOString(),
    });
});

router.get("/ready", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: "ready",
            database: "connected",
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        res.status(200).json({
            status: "not_ready",
            database: "disconnected",
            timestamp: new Date().toISOString(),
        })
    }
});

router.get("/metrics", (_req, res) => {
    res.setHeader("Content-Type", "text/plain");

    res.status(200).send(`# HELP ticketflow_backend_up Backend service status
# TYPE ticketflow_backend_up gauge
ticketflow_backend_up 1
    `);
});

export default router;
