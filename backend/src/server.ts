import "dotenv/config";
import express, { type Request, type Response } from "express";
import observabilityRoutes from "./observability/observability.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js"

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(express.json());

app.use("/", observabilityRoutes);

app.use("/tickets", ticketRoutes);


app.listen(port, () => {
  console.log(`app listening on port ${port }`);
});
