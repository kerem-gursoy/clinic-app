"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Calendar, RefreshCw, Search, Stethoscope, User } from "lucide-react"

import { apiPath } from "@/app/lib/api"
import { EmptyState } from "@/components/empty-state"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AppointmentStatus } from "@/lib/types"

type StatusFilter = AppointmentStatus | "all"

interface AdminAppointmentResponse {
  appointment_id: number
  patientName: string | null
  doctorName: string | null
  doctor_id: number | null
  patient_id: number | null
  status: string | null
  reason: string | null
  start_at: string | null
  time: string | null
  duration: number | null
}

interface AdminAppointmentRow {
  id: string
  appointmentId: number
  patientName: string
  doctorName: string
  doctorId: number | null
  patientId: number | null
  status: AppointmentStatus
  startAt: string | null
  date: string
  time: string
  reason: string
  duration: number
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "checked_in", label: "Checked in" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No-show" },
]

export default function AdminAppointmentsReportPage() {
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      // Staff appointments endpoint joins appointment + patient + doctor tables.
      const res = await fetch(apiPath("/staff/appointments?limit=400"), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok || !Array.isArray(body.appointments)) {
        throw new Error(body?.error || "Failed to load appointments")
      }

      setAppointments(body.appointments.map(mapAdminAppointment))
    } catch (err) {
      console.error(err)
      setAppointments([])
      setError((err as Error).message || "Failed to load appointments")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesSearch =
        search.trim().length === 0 ||
        appt.patientName.toLowerCase().includes(search.toLowerCase()) ||
        appt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
        appt.reason.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "all" || appt.status === statusFilter

      const startDateMatch = !startDate || (appt.startAt && new Date(appt.startAt) >= new Date(startDate))
      const endDateMatch =
        !endDate ||
        (appt.startAt &&
          new Date(appt.startAt) <=
            new Date(new Date(endDate).setHours(23, 59, 59, 999)))

      return matchesSearch && matchesStatus && startDateMatch && endDateMatch
    })
  }, [appointments, endDate, search, startDate, statusFilter])

  const statusTotals = useMemo(() => {
    return filteredAppointments.reduce(
      (acc, appt) => {
        acc.total += 1
        acc.byStatus[appt.status] = (acc.byStatus[appt.status] ?? 0) + 1
        return acc
      },
      {
        total: 0,
        byStatus: {
          scheduled: 0,
          checked_in: 0,
          completed: 0,
          canceled: 0,
          no_show: 0,
        } as Record<AppointmentStatus, number>,
      },
    )
  }, [filteredAppointments])

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Appointments Report</h1>
        <p className="text-muted-foreground">
          Run quick system-level queries across appointments joined with patients and doctors.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient, doctor, or reason"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => {
              setSearch("")
              setStatusFilter("all")
              setStartDate("")
              setEndDate("")
            }}>
              Clear
            </Button>
            <Button variant="secondary" onClick={fetchReport} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total results" value={statusTotals.total} />
            <StatCard title="Scheduled" value={statusTotals.byStatus.scheduled} />
            <StatCard title="Checked in" value={statusTotals.byStatus.checked_in} />
            <StatCard title="Completed" value={statusTotals.byStatus.completed} />
            <StatCard title="Canceled" value={statusTotals.byStatus.canceled} />
            <StatCard title="No-shows" value={statusTotals.byStatus.no_show} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Showing {filteredAppointments.length} of {appointments.length} records
              </span>
            </div>
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>

          {isLoading ? (
            <div className="bg-muted/30 border rounded-lg p-6 text-center text-muted-foreground">Loading…</div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No matching appointments"
              description="Adjust filters or date range to refine your query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-3 pr-3 font-medium">Patient</th>
                    <th className="py-3 px-3 font-medium">Doctor</th>
                    <th className="py-3 px-3 font-medium">Date</th>
                    <th className="py-3 px-3 font-medium">Time</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="border-b last:border-none">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">{appt.patientName}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Patient ID: {appt.patientId ?? "—"}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <div>{appt.doctorName}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Doctor ID: {appt.doctorId ?? "—"}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{appt.date}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{appt.time}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusChip status={appt.status} />
                      </td>
                      <td className="py-3 px-3 max-w-md">
                        <div className="line-clamp-2">{appt.reason}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function mapAdminAppointment(appt: AdminAppointmentResponse): AdminAppointmentRow {
  const start = appt.start_at ? new Date(appt.start_at) : null
  const normalizedStatus = normalizeStatus(appt.status)

  return {
    id: `appt-${appt.appointment_id}`,
    appointmentId: appt.appointment_id,
    patientId: appt.patient_id ?? null,
    patientName: appt.patientName || "Unknown patient",
    doctorId: appt.doctor_id ?? null,
    doctorName: appt.doctorName || "Unassigned",
    status: normalizedStatus,
    startAt: appt.start_at,
    date: start ? start.toISOString().split("T")[0] : "Unknown",
    time:
      appt.time ??
      (start
        ? start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "N/A"),
    reason: appt.reason || "No reason provided",
    duration: appt.duration ?? 0,
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
