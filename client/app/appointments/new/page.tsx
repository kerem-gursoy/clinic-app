"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getStoredAuthUser } from "@/lib/auth"
import { apiPath } from "@/app/lib/api"
import type { UserRole } from "@/lib/types"

export default function NewAppointmentPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
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
  const [minStartValue, setMinStartValue] = useState<string>("")
  const [doctors, setDoctors] = useState<Array<any>>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)
  const [errors, setErrors] = useState<string | null>(null)

  useEffect(() => {
    setMinStartValue(new Date().toISOString().slice(0, 16))
  }, [])

  useEffect(() => {
    const user = getStoredAuthUser()
    if (user) {
      setCurrentUser(user)
      // default provider to current user if doctor
      if (user.role === "doctor") {
        setProviderId(String(user.user_id))
      }
      // if staff, set default to unassigned and try to load doctors list for provider picker
      if (user.role === "staff") {
        setProviderId("unassigned")
        setDoctorsLoading(true)
        setDoctorsError(null)
        ;(async () => {
          try {
            const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
            const res = await fetch(apiPath("/staff/doctors"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            })
            const body = await res.json().catch(() => ({}))
            if (res.ok && Array.isArray(body.doctors)) {
              setDoctors(body.doctors)
            } else {
              console.error("Failed to load doctors. Status:", res.status, "Body:", body)
              setDoctorsError(`Failed to load doctors: ${body.error || 'Unknown error'}`)
            }
          } catch (err) {
            console.error("Failed to load doctors", err)
            setDoctorsError("Failed to load doctors: Network error")
          } finally {
            setDoctorsLoading(false)
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
        const res = await fetch(
          `${apiPath("/patients/search")}?q=${encodeURIComponent(patientQuery)}&limit=25`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            credentials: "include",
          },
        )
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
    
    // Basic validation
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
    
    // For staff, warn if no doctor is selected
    if (currentUser?.role === "staff" && (!providerId || providerId === "unassigned")) {
      const confirmUnassigned = window.confirm(
        "No doctor has been selected for this appointment. Are you sure you want to create an unassigned appointment?"
      )
      if (!confirmUnassigned) {
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + (Number(duration) || 0))

      const payload = {
        patientId: Number(patientId),
        providerId: providerId && providerId !== "unassigned" ? Number(providerId) : null,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        reason,
        status: "scheduled",
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath("/appointments"), {
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

      try {
        localStorage.setItem("appointments_refresh", String(Date.now()))
      } catch (e) {
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
      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-md border p-6">
        
        {/* Patient Selection */}
        <div className="space-y-2">
          <Label htmlFor="patient">Patient</Label>
          <Input
            id="patient"
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value)
              setPatientId("")
            }}
            placeholder="Search patients by name or email (min 2 chars)"
          />
          {patientLoading && <div className="text-xs text-muted-foreground mt-1">Searching…</div>}
          {patientResults.length > 0 && (
            <ul className="border rounded mt-2 bg-background max-h-48 overflow-auto">
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

        {/* Provider Selection - Only show for staff */}
        {currentUser?.role === "staff" && (
          <div className="space-y-2">
            <Label htmlFor="provider">Doctor</Label>
            {doctorsLoading ? (
              <div className="text-sm text-muted-foreground p-2 border rounded">
                Loading doctors...
              </div>
            ) : doctorsError ? (
              <div className="text-sm text-destructive p-2 border rounded bg-destructive/10">
                {doctorsError}
              </div>
            ) : doctors.length > 0 ? (
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">(Unassigned)</SelectItem>
                  {doctors.map((d: any) => (
                    <SelectItem key={d.doctor_id} value={String(d.doctor_id)}>
                      Dr. {d.name}
                      {d.specialty && <span className="text-muted-foreground"> — {d.specialty}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded">
                No doctors found
              </div>
            )}
          </div>
        )}

        {/* Doctor info for doctor users */}
        {currentUser?.role === "doctor" && (
          <div className="space-y-2">
            <Label>Doctor</Label>
            <div className="p-3 bg-muted/20 rounded border">
              <div className="font-medium">Dr. {currentUser.first_name}</div>
              <div className="text-sm text-muted-foreground">
                You are scheduling this appointment for yourself
              </div>
            </div>
          </div>
        )}

        {/* Start Date/Time */}
        <div className="space-y-2">
          <Label htmlFor="start">Start Date & Time</Label>
          <input
            id="start"
            type="datetime-local"
            className="w-full px-3 py-2 border rounded"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            min={minStartValue || undefined}
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input 
            id="duration"
            type="number" 
            value={String(duration)} 
            onChange={(e) => setDuration(Number(e.target.value))}
            min="15"
            step="15"
          />
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Input 
            id="reason"
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Reason for visit or appointment notes" 
          />
        </div>

        {errors && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border">
            {errors}
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-4">
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
