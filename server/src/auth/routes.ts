import { Router, type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import argon2 from "argon2";
import type { RowDataPacket } from "mysql2/promise";
import { pool, createDoctor, createPatient } from "../schedule/pool.js";


type UserRole = "PATIENT" | "DOCTOR" | "STAFF";

interface AuthTokenPayload extends JwtPayload {
  user_id: number;
  role: UserRole;
  email: string;
}

interface RequestWithUser extends Request {
  user?: AuthTokenPayload;
}

interface LoginRow extends RowDataPacket {
  user_id: number;
  email: string;
  password: string;
  role: UserRole;
}

const router = Router();
function signToken(user: Pick<AuthTokenPayload, "user_id" | "role" | "email">) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== "object" || !("user_id" in decoded) || !("role" in decoded) || !("email" in decoded)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = decoded as AuthTokenPayload;
    return next();
  } catch (err) {
    console.warn("JWT verification failed", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const [rows] = await pool.query<LoginRow[]>(
      "SELECT user_id, email, password, role FROM login WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const row = rows[0];
    const passwordMatches = await argon2.verify(row.password, password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = { user_id: row.user_id, role: row.role, email: row.email };
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("Login failed", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/doctors", async (req: Request, res: Response) => {
  try {
    const result = await createDoctor(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createDoctor failed", err);
    return res.status(500).json({ error: "Unable to create doctor" });
  }
});

router.post("/patients", async (req: Request, res: Response) => {
  try {
    const result = await createPatient(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createPatient failed", err);
    return res.status(500).json({ error: "Unable to create patient" });
  }
});

router.get("/me", requireAuth, async (req: RequestWithUser, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { user_id, role, email } = user;

    if (role === "PATIENT") {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM patients WHERE patient_id = ? LIMIT 1",
        [user_id]
      );
      return res.json({ user: { user_id, role, email }, profile: rows[0] ?? null });
    }

    if (role === "DOCTOR") {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM doctors WHERE doctor_id = ? LIMIT 1",
        [user_id]
      );
      return res.json({ user: { user_id, role, email }, profile: rows[0] ?? null });
    }

    if (role === "STAFF") {
      return res.json({ user: { user_id, role, email }, profile: null });
    }

    return res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    console.error("Fetching authenticated user failed", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }
  return secret;
}
