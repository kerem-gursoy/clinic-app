"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAuthUser } from "@/lib/auth"

export default function NewAppointmentPage() {
  const router = useRouter()
  const [patientId, setPatientId] = useState<string>("")
  const [patientQuery, setPatientQuery] = useState<string>("")
  const [patientResults, setPatientResults] = useState<Array<any>>([])
  const [patientLoading, setPatientLoading] = useState(false)
  const searchTimer = useRef<number | null>(null)
  const [providerId, setProviderId] = useState<string>("")
  const [start, setStart] = useState<string>("")
  const [duration, setDuration] = useState<number>(60)
  const [reason, setReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<Array<any>>([])
  const [errors, setErrors] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredAuthUser()
    if (user) {
      // default provider to current user if doctor
      if (user.role === "doctor") setProviderId(String(user.user_id))
      // if staff, try to load doctors list for provider picker
      if (user.role === "staff") {
        ;(async () => {
          try {
            const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"
            const res = await fetch(`${baseUrl}/staff/doctors`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            })
            const body = await res.json().catch(() => ({}))
            if (res.ok && Array.isArray(body.doctors)) {
              setDoctors(body.doctors)
            }
          } catch (err) {
            console.error("Failed to load doctors", err)
          }
        })()
      }
    }
  }, [])

  useEffect(() => {
    // debounce patient search
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    if (!patientQuery || patientQuery.trim().length < 2) {
      setPatientResults([])
      return
    }
    setPatientLoading(true)
    // @ts-ignore setTimeout return type
    searchTimer.current = window.setTimeout(async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"
        const res = await fetch(`${baseUrl}/patients/search?q=${encodeURIComponent(patientQuery)}&limit=25`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(body.patients)) {
          setPatientResults(body.patients)
        } else {
          setPatientResults([])
        }
      } catch (err) {
        console.error("Patient search failed", err)
        setPatientResults([])
      } finally {
        setPatientLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [patientQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors(null)
    // basic validation
    if (!patientId) {
      setErrors("Please select a patient")
      return
    }
    if (!start) {
      setErrors("Please choose a start date and time")
      return
    }
    const startDate = new Date(start)
    if (isNaN(startDate.getTime())) {
      setErrors("Invalid start date/time")
      return
    }
    if (startDate.getTime() < Date.now() - 1000 * 60) {
      setErrors("Start time cannot be in the past")
      return
    }
    if (!duration || duration <= 0) {
      setErrors("Duration must be greater than 0")
      return
    }
    setIsSubmitting(true)
    try {
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

      // set refresh flag so appointments list will reload when we return
      try {
        localStorage.setItem("appointments_refresh", String(Date.now()))
      } catch (e) {
        // ignore
      }
      router.back()
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
          <label className="block text-sm font-medium mb-1">Patient</label>
          <Input
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value)
              // clear selected id if user edits
              setPatientId("")
            }}
            placeholder="Search patients by name or email (min 2 chars)"
          />
          {patientLoading && <div className="text-xs text-muted-foreground mt-1">Searching…</div>}
          {patientResults.length > 0 && (
            <ul className="border rounded mt-2 bg-white max-h-48 overflow-auto">
              {patientResults.map((p) => (
                <li
                  key={p.patient_id}
                  className="p-2 hover:bg-muted/20 cursor-pointer"
                  onClick={() => {
                    setPatientId(String(p.patient_id))
                    setPatientQuery(`${p.patient_fname} ${p.patient_lname}`)
                    setPatientResults([])
                  }}
                >
                  <div className="font-medium">{p.patient_fname} {p.patient_lname}</div>
                  <div className="text-xs text-muted-foreground">{p.patient_email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          {doctors.length > 0 ? (
            <select className="w-full border rounded px-2 py-2" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="">(Unassigned)</option>
              {doctors.map((d: any) => (
                <option key={d.doctor_id} value={d.doctor_id}>{d.doc_fname} {d.doc_lname} {d.specialty ? `— ${d.specialty}` : ""}</option>
              ))}
            </select>
          ) : (
            <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="Provider id (doctor)" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            min={new Date().toISOString().slice(0,16)}
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

        {errors && <div className="text-sm text-destructive">{errors}</div>}
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
