"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, User } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"

export default function PatientHomePage() {
  // Filter appointments for current patient (p1) and only show upcoming
  const upcomingAppointments = mockAppointments
    .filter((apt) => apt.patientId === "p1")
    .filter((apt) => apt.status === "scheduled" || apt.status === "checked-in")
    .slice(0, 3) // Only show next 3 appointments

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Patient Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your upcoming appointments.</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3">
          <Button 
            className="w-full xs:w-auto"
            onClick={() => window.location.href = "/patient/appointments"}
          >
            View All Appointments
          </Button>
          <Button 
            className="w-full xs:w-auto"
            onClick={() => window.location.href = "/patient/appointments/schedule"}
          >
            Schedule Appointment
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments"
              description="You don't have any appointments scheduled."
              action={{
                label: "Schedule Now",
                onClick: () => window.location.href = "/patient/appointments/schedule"
              }}
            />
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusChip status={appointment.status} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(appointment.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
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
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/patient/appointments`}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}