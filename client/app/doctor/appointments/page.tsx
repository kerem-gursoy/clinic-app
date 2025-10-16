"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/status-chip"
import { EmptyState } from "@/components/empty-state"
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import type { Appointment } from "@/lib/types"
import { cn } from "@/lib/utils"

type ViewMode = "week" | "day" | "month" | "agenda"

export default function DoctorAppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filter appointments for current doctor (pr1)
  const doctorAppointments = mockAppointments.filter((apt) => apt.providerId === "pr1")

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
      {viewMode === "agenda" ? (
        <AgendaView appointments={doctorAppointments} />
      ) : (
        <WeekView appointments={doctorAppointments} currentDate={currentDate} />
      )}
    </div>
  )
}

function WeekView({ appointments, currentDate }: { appointments: Appointment[]; currentDate: Date }) {
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

function AgendaView({ appointments }: { appointments: Appointment[] }) {
  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "scheduled" || apt.status === "checked-in")
    .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())

  if (upcomingAppointments.length === 0) {
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
      {upcomingAppointments.map((appointment) => {
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
