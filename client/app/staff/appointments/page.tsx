"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, User, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import type { AppointmentStatus } from "@/lib/types"
import { apiPath } from "@/app/lib/api"

interface StaffAppointmentResponse {
  appointment_id: number
  patient_id: number | null
  doctor_id: number | null
  patientName: string | null
  doctorName: string | null
  status: string | null
  reason: string | null
  start_at: string | null
  time: string | null
  duration: number | null
  notes?: string | null
}

interface StaffAppointmentItem {
  id: string
  appointmentId: number
  patientId: number | null
  patientName: string
  doctorName: string
  status: AppointmentStatus
  date: string
  time: string
  duration: number
  reason: string
  notes?: string | null
}

export default function StaffAppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<StaffAppointmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const cancelledRef = useRef(false)

  async function fetchAppointments() {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const res = await fetch(apiPath("/staff/appointments"), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !Array.isArray(data.appointments)) {
        throw new Error("Failed to load appointments")
      }
      if (cancelledRef.current) return
      setAppointments(data.appointments.map(mapStaffAppointment))
    } catch (err) {
      console.error(err)
      if (!cancelledRef.current) {
        setAppointments([])
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    cancelledRef.current = false
    fetchAppointments()
    return () => {
      cancelledRef.current = true
    }
  }, [])

  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === "visible") {
        const flag = localStorage.getItem("appointments_refresh")
        if (flag) {
          setIsLoading(true)
          await fetchAppointments()
          localStorage.removeItem("appointments_refresh")
        }
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "appointments_refresh") {
        setIsLoading(true)
        fetchAppointments()
        localStorage.removeItem("appointments_refresh")
      }
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("storage", onStorage)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const currentDateStr = currentDate.toISOString().split("T")[0]
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((apt) => apt.date === currentDateStr)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, currentDateStr],
  )

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: newStatus } : apt)),
    )
  }

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const isToday = currentDate.toDateString() === new Date().toDateString()

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Day Agenda</h1>
        <p className="text-muted-foreground">Manage today's appointment schedule</p>
      </div>

      {/* Date Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} disabled={isToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => router.push("/appointments/new")} className="ml-2 hidden sm:inline">
            New Appointment
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading appointments…</div>
      ) : todayAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description={`There are no appointments scheduled for ${isToday ? "today" : "this day"}.`}
        />
      ) : (
        <div className="bg-card rounded-xl border divide-y">
          {todayAppointments.map((appointment) => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              onStatusChange={(newStatus) => handleStatusChange(appointment.id, newStatus)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AppointmentRow({
  appointment,
  onStatusChange,
}: {
  appointment: StaffAppointmentItem
  onStatusChange: (status: AppointmentStatus) => void
}) {
  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Time */}
          <div className="shrink-0 w-20 pt-1">
            <div className="text-sm font-semibold">{appointment.time}</div>
            <div className="text-xs text-muted-foreground">{appointment.duration} min</div>
          </div>

          {/* Appointment Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <StatusChip status={appointment.status} />
            </div>

            <h3 className="font-semibold mb-1">{appointment.patientName}</h3>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{appointment.doctorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{appointment.reason}</span>
              </div>
            </div>

            {appointment.notes && <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange("scheduled")}>Mark as Scheduled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("checked_in")}>Check In</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("completed")}>Mark Complete</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("no_show")}>Mark No-show</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("canceled")} className="text-destructive">
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Reschedule</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function mapStaffAppointment(appt: StaffAppointmentResponse): StaffAppointmentItem {
  const start = appt.start_at ? new Date(appt.start_at) : null
  const date = start ? start.toISOString().split("T")[0] : ""
  const time = formatTime(start)

  return {
    id: `staff-appointment-${appt.appointment_id}`,
    appointmentId: appt.appointment_id,
    patientId: appt.patient_id,
    patientName: appt.patientName ?? "Unknown patient",
    doctorName: appt.doctorName ?? "Unknown doctor",
    status: normalizeStatus(appt.status),
    date,
    time,
    duration: appt.duration ?? 0,
    reason: appt.reason ?? "General visit",
    notes: appt.notes ?? null,
  }
}

function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  const value = (status ?? "scheduled").toLowerCase()
  switch (value) {
    case "completed":
      return "completed"
    case "checked-in":
    case "checked_in":
    case "in-room":
    case "in_room":
      return "checked_in"
    case "cancelled":
    case "canceled":
      return "canceled"
    case "no_show":
      return "no_show"
    case "scheduled":
    default:
      return "scheduled"
  }
}

function formatTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "00:00"
  }
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}
