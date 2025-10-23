"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, User, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import type { Appointment, AppointmentStatus } from "@/lib/types"

export default function StaffAppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)

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
  const todayAppointments = appointments
    .filter((apt) => apt.date === currentDateStr)
    .sort((a, b) => a.time.localeCompare(b.time))

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() } : apt,
      ),
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
        </div>
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
      </div>

      {/* Appointments List */}
      {todayAppointments.length === 0 ? (
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
  appointment: Appointment
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
                <span>
                  {appointment.providerName} • {appointment.providerSpecialty}
                </span>
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
              <DropdownMenuItem onClick={() => onStatusChange("checked-in")}>Check In</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("in-room")}>Move to Room</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("completed")}>Mark Complete</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("cancelled")} className="text-destructive">
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
