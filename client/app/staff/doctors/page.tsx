"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, Phone, Mail, Stethoscope, Calendar } from "lucide-react"
import type { AppointmentStatus } from "@/lib/types"
import { apiPath } from "@/app/lib/api"
import { NewDoctorForm } from "@/components/doctors/new-doctor-form"

interface StaffDoctorResponse {
  doctor_id: number
  name: string
  specialty: string | null
  email: string | null
  phone: string | null
}

interface StaffDoctor {
  id: string
  doctorId: number
  name: string
  specialty: string
  email: string
  phone: string
  todaysAppointments: number
}

interface StaffAppointmentResponse {
  appointment_id: number
  doctor_id: number | null
  status: string | null
  start_at: string | null
}

export default function StaffDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [providers, setProviders] = useState<StaffDoctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewDoctorOpen, setIsNewDoctorOpen] = useState(false)

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const [doctorRes, appointmentsRes] = await Promise.all([
        fetch(apiPath("/staff/doctors"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        }),
        fetch(`${apiPath("/staff/appointments")}?limit=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        }),
      ])

      const [doctorPayload, appointmentsPayload] = await Promise.all([
        doctorRes.json().catch(() => ({})),
        appointmentsRes.json().catch(() => ({})),
      ])

      if (!doctorRes.ok || !Array.isArray(doctorPayload.doctors)) {
        throw new Error("Failed to load doctors")
      }
      if (!appointmentsRes.ok || !Array.isArray(appointmentsPayload.appointments)) {
        throw new Error("Failed to load appointments")
      }

      const today = new Date().toISOString().split("T")[0]
      const counts = new Map<number, number>()

      for (const appointment of appointmentsPayload.appointments as StaffAppointmentResponse[]) {
        const doctorId = appointment.doctor_id
        if (!doctorId) continue
        const status = normalizeStatus(appointment.status)
        const startDate = appointment.start_at ? appointment.start_at.split("T")[0] : null
        if (startDate === today && (status === "scheduled" || status === "checked_in")) {
          counts.set(doctorId, (counts.get(doctorId) ?? 0) + 1)
        }
      }

      const mapped = (doctorPayload.doctors as StaffDoctorResponse[]).map((doctor) => ({
        id: `doctor-${doctor.doctor_id}`,
        doctorId: doctor.doctor_id,
        name: doctor.name,
        specialty: doctor.specialty ?? "General",
        email: doctor.email ?? "N/A",
        phone: doctor.phone ?? "N/A",
        todaysAppointments: counts.get(doctor.doctor_id) ?? 0,
      }))

      setProviders(mapped)
    } catch (err) {
      console.error(err)
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const filteredProviders = useMemo(
    () =>
      providers.filter(
        (provider) =>
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [providers, searchQuery],
  )

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Doctor Lookup</h1>
          <p className="text-muted-foreground">Search providers and view their availability</p>
        </div>
        <Button className="rounded-full" onClick={() => setIsNewDoctorOpen(true)}>
          + Add Doctor
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialty, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading providers…</div>
      ) : searchQuery && filteredProviders.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No doctors found"
          description="Try adjusting your search terms or browse all providers."
        />
      ) : filteredProviders.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No providers available" description="Provider list is empty." />
      ) : (
        <div className="bg-card rounded-xl border divide-y">
          {filteredProviders.map((provider) => (
            <ProviderRow key={provider.id} provider={provider} />
          ))}
        </div>
      )}
      <Dialog open={isNewDoctorOpen} onOpenChange={setIsNewDoctorOpen}>
        <DialogContent className="max-w-2xl p-0" showCloseButton>
          <div className="px-6 py-6">
            <NewDoctorForm
              onCancel={() => setIsNewDoctorOpen(false)}
              onSuccess={() => {
                setIsNewDoctorOpen(false)
                fetchProviders()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProviderRow({ provider, onDelete }: { provider: StaffDoctor; onDelete?: () => void }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const upcomingCount = provider.todaysAppointments

  return (
    <>
      <div className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>

            {/* Provider Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{provider.name}</h3>
                <Badge variant="secondary" className="rounded-full">
                  {provider.specialty}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{provider.phone}</span>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="mt-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">{upcomingCount}</span>{" "}
                  <span className="text-muted-foreground">
                    {upcomingCount === 1 ? "appointment" : "appointments"} today
                  </span>
                </span>                  
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full bg-transparent">
              View Schedule
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsDetailsOpen(true)}>
              Details
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl p-0" showCloseButton>
          <div className="px-6 py-6">
            <NewDoctorForm
              doctorId={provider.doctorId}
              onCancel={() => setIsDetailsOpen(false)}
              onSuccess={() => {
                setIsDetailsOpen(false)
                onDelete?.()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
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
