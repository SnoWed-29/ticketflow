import "dotenv/config";
import express, { type Request, type Response } from "express";
import observabilityRoutes from "./observability/observability.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js"
import commentRoutes from "./modules/comments/comment.routes.js";
import ticketCommentRoutes from "./modules/comments/ticket-comments.routes.js";
import { authenticate } from "./modules/auth/auth.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
// import { getKeycloakAuthConfig } from "./modules/auth";

// const keycloakConfig = getKeycloakAuthConfig();

// console.log("Keycloak authentication configuration:", {
//   issuer: keycloakConfig.issuer,
//   jwksUrl: keycloakConfig.jwksUrl,
//   audience: keycloakConfig.audience,
//   allowedClients: keycloakConfig.allowedClients,
// });

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.disable("x-powered-by");

app.use(express.json());

app.use("/", observabilityRoutes);

app.use("/api", authenticate);

app.use("/api", authRouter);

app.use("/api/tickets", ticketRoutes);
app.use("/api/tickets", ticketCommentRoutes);
app.use("/api/comments", commentRoutes);

app.listen(port, () => {
  console.log(`app listening on port ${port }`);
});
