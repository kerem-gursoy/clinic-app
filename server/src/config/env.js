import dotenv from "dotenv";

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

export const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const appPort = Number(process.env.PORT ?? 8080);

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }
  return secret;
}

export function getEmailConfig() {
  return {
    enabled: process.env.EMAIL_ENABLED === "true",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    fromEmail: process.env.EMAIL_FROM || "noreply@clinic.com",
    fromName: process.env.EMAIL_FROM_NAME || "Clinic Appointment System",
  };
}