import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import appointmentsRouter from "./schedule/routes.js";
import authRouter from "./auth/routes.js";

import patientRouter from "./patient/routes.js";

const app = express();
<<<<<<< HEAD
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
=======
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRouter);
app.use("/api/appointments", appointmentsRouter)
app.use("/api/patient", patientRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API on port: ${PORT}`));


