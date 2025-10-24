import type { UserRole } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";
type ApiUserRole = "PATIENT" | "DOCTOR" | "STAFF";

interface ApiAuthUser {
  user_id: number;
  email: string;
  role: ApiUserRole;
}

export interface AuthUser {
  user_id: number;
  email: string;
  role: UserRole;
}

interface LoginSuccessPayload {
  token: string;
  user: ApiAuthUser;
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("authToken");
}

function normalizeRole(role: ApiUserRole): UserRole {
  return role.toLowerCase() as UserRole;
}

function persistAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("authToken", token);
  window.localStorage.setItem("authUser", JSON.stringify(user));
}

function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("authToken");
  window.localStorage.removeItem("authUser");
}

export async function login(email: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const payload: Partial<LoginSuccessPayload> & { error?: string } = await response.json().catch(() => ({}));

  if (!response.ok || !payload.token || !payload.user) {
    const errorMessage = payload.error ?? "Invalid email or password";
    throw new Error(errorMessage);
  }

  const authUser: AuthUser = {
    user_id: payload.user.user_id,
    email: payload.user.email,
    role: normalizeRole(payload.user.role),
  };

  persistAuth(payload.token, authUser);
  return { token: payload.token, user: authUser };
}

export async function logout() {
  const token = getStoredToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to log out");
  }

  clearStoredAuth();
}
