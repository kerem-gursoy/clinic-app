// app/lib/api.ts
export function getApiBaseUrl() {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    if (!v) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is missing at build time.");
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/i.test(v)) {
      throw new Error(`Invalid NEXT_PUBLIC_API_BASE_URL for production: ${v}`);
    }
    return v;
  }

  return v ?? "http://localhost:3000";
}

export function apiPath(p: string) {
  return `${getApiBaseUrl()}/api${p.startsWith("/") ? p : `/${p}`}`;
}
