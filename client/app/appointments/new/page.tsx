"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAuthUser } from "@/lib/auth"

export default function NewAppointmentPage() {
  const router = useRouter()
  const [patientId, setPatientId] = useState<string>("")
  const [providerId, setProviderId] = useState<string>("")
  const [start, setStart] = useState<string>("")
  const [duration, setDuration] = useState<number>(60)
  const [reason, setReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const user = getStoredAuthUser()
    if (user) {
      // default provider to current user if doctor
      if (user.role === "doctor") setProviderId(String(user.user_id))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !start) return
    setIsSubmitting(true)
    try {
      const startDate = new Date(start)
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + (Number(duration) || 0))

      const payload = {
        patientId: Number(patientId),
        providerId: providerId ? Number(providerId) : null,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        reason,
        status: "scheduled",
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"

      const res = await fetch(`${baseUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to create appointment")
      }

      // redirect back to appropriate appointments list
      const user = getStoredAuthUser()
      if (user?.role === "doctor") router.push("/doctor/appointments")
      else if (user?.role === "staff") router.push("/staff/appointments")
      else router.push("/patient/appointments")
    } catch (err) {
      console.error(err)
      alert((err as any)?.message ?? "Failed to create appointment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Schedule New Appointment</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-md border p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Patient ID</label>
          <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Numeric patient id" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Provider ID (optional)</label>
          <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="Provider id (doctor)" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <Input type="number" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason or visit notes" />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Appointment"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
