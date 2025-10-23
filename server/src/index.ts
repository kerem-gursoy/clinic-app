import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import appointmentsRouter from "./schedule/routes.js";
import authRouter from "./auth/routes.js";

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"], credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRouter);
app.use("/api/appointments", appointmentsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
