import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn("JWT verification failed", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

