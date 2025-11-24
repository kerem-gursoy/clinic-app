import { apiPath } from "@/app/lib/api";

export async function updateAppointmentStatus(appointmentId: number, status: string): Promise<void> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;

  const res = await fetch(apiPath(`/appointments/${appointmentId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update appointment");
  }
}