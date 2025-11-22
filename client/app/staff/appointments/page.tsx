"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from "lucide-react"
import type { AppointmentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { apiPath } from "@/app/lib/api"
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form"
import { CancelAppointmentForm } from "@/components/appointments/cancel-appointment-form"

type ViewMode = "week" | "agenda"

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: "week", label: "Week" },
  { value: "agenda", label: "Agenda" },
]

const STATUS_FILTERS: Array<{ value: AppointmentStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No-show" },
]

interface StaffDoctor {
  doctor_id: number
  name: string
  specialty?: string | null
}

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
  doctorId: number | null
  doctorName: string
  status: AppointmentStatus
  date: string
  time: string
  duration: number
  reason: string
  notes?: string | null
}

export default function StaffAppointmentsPage() {
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("agenda")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<StaffAppointmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all")
  const [doctors, setDoctors] = useState<StaffDoctor[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)
  const [showNewAppointment, setShowNewAppointment] = useState(false)


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
    let cancelled = false
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
        if (!res.ok || !Array.isArray(body.doctors)) {
          throw new Error(body?.error || "Failed to load doctors")
        }
        if (!cancelled) {
          setDoctors(body.doctors as StaffDoctor[])
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setDoctorsError("Unable to load doctors")
        }
      } finally {
        if (!cancelled) {
          setDoctorsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
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

  const doctorFilteredAppointments = useMemo(() => {
    if (selectedDoctorId === "all") {
      return appointments
    }
    return appointments.filter((apt) => apt.doctorId !== null && String(apt.doctorId) === selectedDoctorId)
  }, [appointments, selectedDoctorId])

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
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
    }
    return ""
  }

  const dateRangeText = getDateRangeText()

  const doctorSelect = (
    <div className="w-full sm:w-64">
      <p className="text-sm font-medium mb-1">Filter by doctor</p>
      <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} disabled={doctorsLoading}>
        <SelectTrigger>
          <SelectValue placeholder="All doctors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All doctors</SelectItem>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.doctor_id} value={String(doctor.doctor_id)}>
              Dr. {doctor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {doctorsError && <p className="text-xs text-destructive mt-1">{doctorsError}</p>}
    </div>
  )

  const hasAppointments = doctorFilteredAppointments.length > 0

  return (
    <>
      {/* Flash message (fixed, above dialogs) */}
      {flash ? (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center pointer-events-none px-4">
          <div
            role="status"
            className={`pointer-events-auto w-full max-w-3xl rounded-md p-3 border ${
              flash.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>{flash.text}</div>
              <button
                aria-label="dismiss"
                onClick={() => setFlash(null)}
                className="ml-4 text-sm opacity-80 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Clinic Calendar</h1>
            <p className="text-muted-foreground">View and coordinate every provider&apos;s schedule</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {VIEW_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant={viewMode === value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setViewMode(value)}
              >
                {label}
              </Button>
            ))}
            <Button size="sm" onClick={() => setShowNewAppointment(true)} className="rounded-full">
              + New Appointment
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {doctorSelect}
          {viewMode === "agenda" && (
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {viewMode === "week" && (
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
            {dateRangeText && <h2 className="text-lg font-semibold">{dateRangeText}</h2>}
          </div>
        )}

        {isLoading ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading appointments…</div>
        ) : !hasAppointments ? (
          <EmptyState
            icon={Calendar}
            title="No appointments"
            description="Try selecting a different doctor or adjust your filters."
          />
        ) : viewMode === "agenda" ? (
          <AgendaView appointments={doctorFilteredAppointments} statusFilter={statusFilter} />
        ) : (
          <WeekView appointments={doctorFilteredAppointments} currentDate={currentDate} />
        )}
      </div>

      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="max-w-3xl p-0" showCloseButton>
          <div className="px-6 py-6">
            <NewAppointmentForm
              onCancel={() => setShowNewAppointment(false)}
              onSuccess={() => {
                setShowNewAppointment(false)
                setIsLoading(true)
                fetchAppointments()
              }}
              onNotify={(text: string, type: "success" | "error" = "success") => {
                setFlash({ text, type })
                window.setTimeout(() => setFlash(null), 4000)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function WeekView({ appointments, currentDate }: { appointments: StaffAppointmentItem[]; currentDate: Date }) {
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
                <div key={i} className="p-2 border-r last:border-r-0 min-h-20 hover:bg-muted/30 transition-colors">
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-primary/10 border-l-2 border-primary rounded p-2 mb-2 cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      <div className="text-xs font-medium mb-1">{apt.time}</div>
                      <div className="text-sm font-semibold">{apt.patientName}</div>
                      <div className="text-xs text-muted-foreground">Dr. {apt.doctorName}</div>
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

function AgendaView({
  appointments,
  statusFilter,
}: {
  appointments: StaffAppointmentItem[]
  statusFilter: AppointmentStatus | "all"
}) {
  const now = Date.now()

  const filtered = appointments.filter((apt) => statusFilter === "all" || apt.status === statusFilter)
  const upcoming = filtered.filter((apt) => new Date(`${apt.date}T${apt.time}`).getTime() >= now)
  const past = filtered.filter((apt) => new Date(`${apt.date}T${apt.time}`).getTime() < now)

  const sortedAppointments = [
    ...upcoming.sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
    ),
    ...past
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
      )
      .reverse(),
  ]

  if (sortedAppointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No appointments"
        description="No appointments match the selected filters."
      />
    )
  }

  return (
    <div className="bg-card rounded-xl border divide-y">
      {sortedAppointments.map((appointment) => (
        <AgendaListItem key={appointment.id} appointment={appointment} />
      ))}
    </div>
  )
}

function AgendaListItem({ appointment }: { appointment: StaffAppointmentItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const appointmentDate = new Date(`${appointment.date}T00:00:00`)
  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
  const formattedTime = startDateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const [showCancelForm, setShowCancelForm] = useState(false)

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
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
                {formattedTime} ({appointment.duration} min)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>Dr. {appointment.doctorName}</span>
            </div>
          </div>

          {appointment.notes && <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>}
        </div>

        <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
          View
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Appointment for</p>
              <h3 className="text-xl font-semibold">{appointment.patientName}</h3>
              <p className="text-sm text-muted-foreground">with Dr. {appointment.doctorName}</p>
            </div>

            <div className="space-y-2 text-sm">
              <DetailRow label="Status" value={<StatusChip status={appointment.status} />} />
              <DetailRow label="Date" value={formattedDate} />
              <DetailRow label="Time" value={`${formattedTime} (${appointment.duration} min)`} />
              <DetailRow label="Reason" value={appointment.reason} />
              {appointment.notes && <DetailRow label="Notes" value={appointment.notes} />}
            </div>

            <div className="flex justify-end gap-2">
                {appointment.status === "scheduled" && (
                <>         
                <Button variant="outline" onClick={() => setShowCancelForm(true)}>
                    Cancel Appointment
                </Button>
                <Dialog open={showCancelForm} onOpenChange={setShowCancelForm}>
                     <DialogContent>
                         <CancelAppointmentForm
                          appointmentId={appointment.appointmentId} 
                          onSuccess={() => {
                          setShowCancelForm(false)  
                          localStorage.setItem("appointments_refresh", String(Date.now())) // refresh appointments
                          }}
                          onCancel={() => setShowCancelForm(false)} 
                          />
                     </DialogContent>
                </Dialog>
                </>
                )}
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                     Close
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function mapStaffAppointment(appt: StaffAppointmentResponse): StaffAppointmentItem {
  const start = appt.start_at ? new Date(appt.start_at) : null
  const date = formatDateKey(start)
  const time = formatTimeForCalendar(start)

  return {
    id: `staff-appointment-${appt.appointment_id}`,
    appointmentId: appt.appointment_id,
    patientId: appt.patient_id,
    patientName: appt.patientName ?? "Unknown patient",
    doctorId: appt.doctor_id,
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

function formatTimeForCalendar(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "00:00"
  }
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

function formatDateKey(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) {
    return ""
  }
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}