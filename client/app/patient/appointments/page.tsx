"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Filter } from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils"
import { apiPath } from "@/app/lib/api";
import { CancelAppointmentForm } from "@/components/appointments/cancel-appointment-form"

interface PatientAppointmentResponse {
  appointment_id: number;
  patient_id: number;
  doctor_id: number | null;
  providerName: string | null;
  reason: string | null;
  status: string | null;
  start_at: string | null;
  time: string | null;
  duration: number | null;
  notes?: string | null;
  procedure_code?: string | null;
  amount?: number | null;
}

interface PatientAppointment {
  appointment_id: number;
  providerName: string;
  reason: string;
  status: AppointmentStatus;
  start_at: string | null;
  date: string; // yyyy-mm-dd
  displayTime: string;
  duration: number;
  notes?: string | null;
  procedure_code?: string | null;
  amount?: number | null;
}

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "all">("all");

    const fetchGuardRef = useRef(false);
    useEffect(() => {
        const didFetch = fetchGuardRef.current;
        if (didFetch) return;
        fetchGuardRef.current = true;

        const fetchAppointments = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
                const res = await fetch(apiPath("/patient/appointments"), {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    credentials: "include",
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error("Failed to load appointments");
                }

                const parsed = Array.isArray(data.appointments)
                    ? (data.appointments as PatientAppointmentResponse[]).map(mapPatientAppointment)
                    : [];
                setAppointments(parsed);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAppointments();
    }, []);

    // Filter appointments for current patient (p1)
    const filteredAppointments =
        selectedStatus === "all"
            ? appointments
            : appointments.filter((apt) => apt.status === selectedStatus);

    const upcomingAppointments = filteredAppointments.filter((apt) =>
        ["scheduled", "checked_in"].includes(apt.status)
    );

    const pastAppointments = filteredAppointments.filter((apt) =>
        ["completed", "canceled", "no_show"].includes(apt.status)
    );


    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">My Appointments</h1>
                <p className="text-muted-foreground">View and manage your upcoming and past appointments</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
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
                    variant={selectedStatus === "canceled" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedStatus("canceled")}
                >
                    Canceled
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
                  <AppointmentRow
                    key={appointment.appointment_id}
                    appointment={appointment}
                    onCancelSuccess={(id) => {
                      setAppointments((prev) =>
                        prev.map((apt) =>
                          apt.appointment_id === id ? { ...apt, status: "canceled" } : apt
                        )
                      )
                    }}
                  />
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
                  <AppointmentRow
                    key={appointment.appointment_id}
                    appointment={appointment}
                    onCancelSuccess={(id) => {
                      setAppointments((prev) =>
                        prev.map((apt) =>
                          apt.appointment_id === id ? { ...apt, status: "canceled" } : apt
                        )
                      )
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
    )
}

function AppointmentRow({
  appointment,
  onCancelSuccess,
}: {
  appointment: PatientAppointment
  onCancelSuccess: (id: number) => void
}) {
  const appointmentDate = appointment.start_at ? new Date(appointment.start_at) : new Date()
  const [isOpen, setIsOpen] = useState(false)
  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const formattedTime = appointment.displayTime
  const [showCancelForm, setShowCancelForm] = useState(false)

    return (
        <div className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <StatusChip status={appointment.status} />
                        <span className="text-sm text-muted-foreground">{formattedDate}</span>
                    </div>

          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold">{appointment.procedure_code} — ${appointment.amount}</h3>
            
          </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>{appointment.providerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>
                                {formattedTime} ({appointment.duration} min)
                            </span>
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
              <DialogTitle className="text-xl font-semibold">{appointment.reason}</DialogTitle>
              <p className="text-sm text-muted-foreground">with {appointment.providerName}</p>
            </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className="text-right font-medium"><StatusChip status={appointment.status} /></span>
                            </div>
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="text-right font-medium">{formattedDate}</span>
                            </div>
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Time</span>
                                <span className="text-right font-medium">{formattedTime} ({appointment.duration} min)</span>
                            </div>
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Reason</span>
                                <span className="text-right font-medium">{appointment.reason}</span>
                            </div>
                            {appointment.notes && (
                                <div className="flex items-start justify-between gap-4 text-sm">
                                    <span className="text-muted-foreground">Notes</span>
                                    <span className="text-right font-medium">{appointment.notes}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            {appointment.status === "scheduled" && (
                                <>
                                    <Button variant="outline" onClick={() => setShowCancelForm(true)}>
                                        Cancel Appointment
                                    </Button>

                  <Dialog open={showCancelForm} onOpenChange={setShowCancelForm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Appointment</DialogTitle>
                      </DialogHeader>
                      <CancelAppointmentForm
                        appointmentId={appointment.appointment_id}
                        onSuccess={() => {
                          onCancelSuccess(appointment.appointment_id)
                          setShowCancelForm(false)
                          setIsOpen(false)
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

function mapPatientAppointment(appt: PatientAppointmentResponse): PatientAppointment {
  return {
    appointment_id: appt.appointment_id,
    providerName: appt.providerName ?? "Clinic team",
    reason: appt.reason ?? "General visit",
    status: normalizeStatus(appt.status),
    start_at: appt.start_at,
    date: formatDateKey(appt.start_at),
    displayTime: formatTime(appt.start_at),
    duration: appt.duration ?? 0,
    notes: appt.notes ?? null,
    procedure_code: appt.procedure_code ?? null,
    amount: appt.amount ?? null,
  };
}

function normalizeStatus(status: string | null | undefined): AppointmentStatus {
    const value = (status ?? "scheduled").toLowerCase();
    switch (value) {
        case "completed":
            return "completed";
        case "cancelled":
        case "canceled":
            return "canceled";
        case "checked-in":
        case "checked_in":
        case "in-room":
        case "in_room":
            return "checked_in";
        case "no_show":
            return "no_show";
        case "scheduled":
        default:
            return "scheduled";
    }
}

function formatTime(startAt: string | null | undefined): string {
    if (!startAt) return "00:00";
    const date = new Date(startAt);
    if (Number.isNaN(date.getTime())) {
        return "00:00";
    }
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatDateKey(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const day = d.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
}