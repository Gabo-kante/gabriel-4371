import express from "express";
import cors from "cors";
import helmet from "helmet";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}