import express from "express";
import { authRouter } from "./container.js";
import { errorHandler } from "./middleware/error-handler.js";
import { mountDocs } from "./docs/swagger.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "100kb" }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", authRouter);
  mountDocs(app);

  // Must be registered last
  app.use(errorHandler);
  return app;
}
