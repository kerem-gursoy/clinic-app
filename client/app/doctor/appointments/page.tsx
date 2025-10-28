"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from "lucide-react"
import type { AppointmentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DoctorAppointmentResponse {
  appointment_id: number
  patient_id: number | null
  provider_id: number
  providerName: string | null
  patientName: string | null
  reason: string | null
  status: string | null
  start_at: string | null
  time: string | null
  duration: number | null
  notes?: string | null
}

interface CalendarAppointment {
  id: string
  appointmentId: number
  patientId: number | null
  patientName: string
  reason: string
  status: AppointmentStatus
  date: string
  time: string
  duration: number
  notes?: string | null
}

type ViewMode = "week" | "day" | "month" | "agenda"

export default function DoctorAppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")

  useEffect(() => {
    let cancelled = false

    const fetchAppointments = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"
        const res = await fetch(`${baseUrl}/doctor/appointments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.appointments)) {
          throw new Error("Failed to load appointments")
        }

        if (cancelled) return
        setAppointments(data.appointments.map(mapAppointment))
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setAppointments([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchAppointments()
    return () => {
      cancelled = true
    }
  }, [])

  const doctorAppointments = useMemo(() => appointments, [appointments])

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDateRangeText = () => {
    if (viewMode === "week") {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    } else if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    } else if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }
    return ""
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">My Calendar</h1>
          <p className="text-muted-foreground">Manage your appointment schedule</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "agenda" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setViewMode("agenda")}
          >
            Agenda
          </Button>
        </div>
      </div>

      {/* Status Filter (agenda view only) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("all")}
          disabled={viewMode !== "agenda"}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "scheduled" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("scheduled")}
          disabled={viewMode !== "agenda"}
        >
          Scheduled
        </Button>
        <Button
          variant={statusFilter === "checked_in" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("checked_in")}
          disabled={viewMode !== "agenda"}
        >
          Checked In
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("completed")}
          disabled={viewMode !== "agenda"}
        >
          Completed
        </Button>
        <Button
          variant={statusFilter === "canceled" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("canceled")}
          disabled={viewMode !== "agenda"}
        >
          Canceled
        </Button>
        <Button
          variant={statusFilter === "no_show" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setStatusFilter("no_show")}
          disabled={viewMode !== "agenda"}
        >
          No-show
        </Button>
      </div>
      {/* Calendar Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{getDateRangeText()}</h2>
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading schedule…</div>
      ) : doctorAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description="Your appointments will appear here once they are scheduled."
        />
      ) : viewMode === "agenda" ? (
        <AgendaView appointments={doctorAppointments} statusFilter={statusFilter} />
      ) : (
        <WeekView appointments={doctorAppointments} currentDate={currentDate} />
      )}
    </div>
  )
}

function WeekView({ appointments, currentDate }: { appointments: CalendarAppointment[]; currentDate: Date }) {
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  const getAppointmentsForDay = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.date === dayStr)
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-4 border-r bg-muted/30"></div>
        {weekDays.map((day, i) => (
          <div key={i} className="p-4 text-center border-r last:border-r-0">
            <div className="text-xs text-muted-foreground mb-1">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                day.toDateString() === new Date().toDateString() && "text-primary",
              )}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="overflow-auto max-h-[600px]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-4 border-r bg-muted/30 text-sm text-muted-foreground">
              {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            {weekDays.map((day, i) => {
              const dayAppointments = getAppointmentsForDay(day)
              const hourAppointments = dayAppointments.filter((apt) => {
                const aptHour = Number.parseInt(apt.time.split(":")[0])
                return aptHour === hour
              })

              return (
                <div key={i} className="p-2 border-r last:border-r-0 min-h-[80px] hover:bg-muted/30 transition-colors">
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-primary/10 border-l-2 border-primary rounded p-2 mb-2 cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      <div className="text-xs font-medium mb-1">{apt.time}</div>
                      <div className="text-sm font-semibold mb-1">{apt.patientName}</div>
                      <div className="text-xs text-muted-foreground">{apt.reason}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgendaView({ appointments, statusFilter }: { appointments: CalendarAppointment[]; statusFilter: AppointmentStatus | "all" }) {
  const sortedAppointments = appointments
    .filter((apt) => statusFilter === "all" || apt.status === statusFilter)
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    )

  if (sortedAppointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No upcoming appointments"
        description="Your schedule is clear. Upcoming appointments will appear here."
      />
    )
  }

  return (
    <div className="bg-card rounded-xl border divide-y">
      {sortedAppointments.map((appointment) => {
        const appointmentDate = new Date(appointment.date)
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        return (
          <div key={appointment.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <StatusChip status={appointment.status} />
                  <span className="text-sm text-muted-foreground">{formattedDate}</span>
                </div>

                <h3 className="font-semibold mb-1">{appointment.patientName}</h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {appointment.time} ({appointment.duration} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{appointment.reason}</span>
                  </div>
                </div>

                {appointment.notes && <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>}
              </div>

              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function mapAppointment(appt: DoctorAppointmentResponse): CalendarAppointment {
  const start = appt.start_at ? new Date(appt.start_at) : null
  const date = start ? start.toISOString().split("T")[0] : ""
  const time = formatTimeForCalendar(start)

  return {
    id: `appointment-${appt.appointment_id}`,
    appointmentId: appt.appointment_id,
    patientId: appt.patient_id,
    patientName: appt.patientName ?? "Unknown patient",
    reason: appt.reason ?? "General visit",
    status: normalizeStatus(appt.status),
    date,
    time,
    duration: appt.duration ?? 0,
    notes: appt.notes ?? null,
  }
}

function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  const value = (status ?? "scheduled").toLowerCase()
  switch (value) {
    case "completed":
      return "completed"
    case "cancelled":
    case "canceled":
      return "canceled"
    case "checked-in":
    case "checked_in":
    case "in-room":
    case "in_room":
      return "checked_in"
    case "no_show":
      return "no_show"
    case "scheduled":
    default:
      return "scheduled"
  }
}

function formatTimeForCalendar(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "00:00"
  }
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}
