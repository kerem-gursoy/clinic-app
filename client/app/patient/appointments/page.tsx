"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { Calendar, Clock, User, Filter } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import type { Appointment, AppointmentStatus } from "@/lib/types"

export default function PatientAppointmentsPage() {
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "all">("all")

  // Filter appointments for current patient (p1)
  const patientAppointments = mockAppointments.filter((apt) => apt.patientId === "p1")

  const filteredAppointments =
    selectedStatus === "all" ? patientAppointments : patientAppointments.filter((apt) => apt.status === selectedStatus)

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "checked-in",
  )

  const pastAppointments = filteredAppointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled",
  )

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your upcoming and past appointments</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedStatus("all")}
        >
          All
        </Button>
        <Button
          variant={selectedStatus === "scheduled" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedStatus("scheduled")}
        >
          Scheduled
        </Button>
        <Button
          variant={selectedStatus === "completed" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedStatus("completed")}
        >
          Completed
        </Button>
        <Button
          variant={selectedStatus === "cancelled" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedStatus("cancelled")}
        >
          Cancelled
        </Button>
      </div>

      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description="You don't have any appointments matching the selected filter."
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
              <div className="bg-card rounded-xl border divide-y">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Past</h2>
              <div className="bg-card rounded-xl border divide-y">
                {pastAppointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const appointmentDate = new Date(appointment.date)
  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusChip status={appointment.status} />
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
          </div>

          <h3 className="font-semibold mb-1">{appointment.reason}</h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{appointment.providerName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {appointment.time} ({appointment.duration} min)
              </span>
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
}
