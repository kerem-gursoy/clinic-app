// app/lib/api.ts
const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const apiBaseUrl = (() => {
  if (process.env.NODE_ENV === "production") {
    if (!rawBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is missing at build time.");
    }
    return rawBaseUrl;
  }

  return rawBaseUrl ?? "http://localhost:8080";
})();

export { apiBaseUrl };

export function apiPath(p: string) {
  const normalizedPath = p.startsWith("/") ? p : `/${p}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
