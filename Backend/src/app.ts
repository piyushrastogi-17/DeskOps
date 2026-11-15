
import "./config/env";

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import corsMiddleware from "./config/cors";
import authRoutes from "./modules/auth/auth.routes";
import ticketRoutes from "./modules/tickets/ticket.routes";

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "DeskOps backend is running!",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tickets", ticketRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: "Route not found." },
  });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      success: false,
      error: { message: "Internal server error." },
    });
  },
);

export default app;
