import "dotenv/config";
import express, { type Request, type Response } from "express";
import observabilityRoutes from "./observability/observability.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js"
import commentRoutes from "./modules/comments/comment.routes.js";
import ticketCommentRoutes from "./modules/comments/ticket-comments.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(express.json());

app.use("/", observabilityRoutes);

app.use("/api/tickets", ticketRoutes);
app.use("/api/tickets", ticketCommentRoutes);
app.use("/api/comments", commentRoutes);

app.listen(port, () => {
  console.log(`app listening on port ${port }`);
});
