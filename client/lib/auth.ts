import type { UserRole } from "./types";
import { apiPath } from "@/app/lib/api";
type ApiUserRole = "PATIENT" | "DOCTOR" | "STAFF";

interface ApiAuthUser {
  user_id: number;
  email: string;
  role: ApiUserRole;
  first_name?: string;
  last_name?: string;
}

export interface AuthUser {
  user_id: number;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
}

interface LoginSuccessPayload {
  token: string;
  user: ApiAuthUser;
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

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("authToken");
  window.localStorage.removeItem("authUser");
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("authUser");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  const response = await fetch(apiPath("/me"), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (response.status === 401 || response.status === 403) {
    clearStoredAuth();
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (!payload || !payload.user) {
    return null;
  }

  const authUser: AuthUser = {
    user_id: payload.user.user_id,
    email: payload.user.email,
    role: normalizeRole(payload.user.role as ApiUserRole),
    first_name: payload.user.first_name,
    last_name: payload.user.last_name,
  };

  persistAuth(token, authUser);
  return authUser;
}

export async function login(email: string, password: string) {
  const response = await fetch(apiPath("auth/login"), {
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
    first_name: payload.user.first_name,
    last_name: payload.user.last_name,
  };

  persistAuth(payload.token, authUser);
  return { token: payload.token, user: authUser };
}

export async function signupPatient({
  first_name,
  last_name,
  email,
  password,
  phone,
  dob,
}: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  dob?: string;
}) {
  const response = await fetch(apiPath("auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name, last_name, email, password, phone, dob }),
    credentials: "include",
  });

  const payload: Partial<LoginSuccessPayload> & { error?: string } = await response.json().catch(() => ({}));

  if (!response.ok || !payload.token || !payload.user) {
    const errorMessage = payload.error ?? "Unable to create account";
    throw new Error(errorMessage);
  }

  const authUser: AuthUser = {
    user_id: payload.user.user_id,
    email: payload.user.email,
    role: normalizeRole(payload.user.role),
    first_name: payload.user.first_name,
    last_name: payload.user.last_name,
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

  const response = await fetch(apiPath("/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to log out");
  }

  clearStoredAuth();
}
