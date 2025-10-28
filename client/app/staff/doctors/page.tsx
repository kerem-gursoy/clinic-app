"use client"

<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react"
=======
import { useState } from "react"
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Search, Phone, Mail, Stethoscope, Calendar } from "lucide-react"
<<<<<<< HEAD
import type { AppointmentStatus } from "@/lib/types"

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

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"

        const [doctorRes, appointmentsRes] = await Promise.all([
          fetch(`${baseUrl}/staff/doctors`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            credentials: "include",
          }),
          fetch(`${baseUrl}/staff/appointments?limit=500`, {
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

        if (cancelled) return

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
        if (!cancelled) {
          setProviders([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredProviders = useMemo(
    () =>
      providers.filter(
        (provider) =>
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [providers, searchQuery],
=======
import { mockProviders, mockAppointments } from "@/lib/mock-data"
import type { Provider } from "@/lib/types"

export default function StaffDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [providers] = useState<Provider[]>(mockProviders)

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchQuery.toLowerCase()),
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
  )

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Doctor Lookup</h1>
        <p className="text-muted-foreground">Search providers and view their availability</p>
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
<<<<<<< HEAD
      {isLoading ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading providers…</div>
      ) : searchQuery && filteredProviders.length === 0 ? (
=======
      {searchQuery && filteredProviders.length === 0 ? (
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
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
    </div>
  )
}

<<<<<<< HEAD
function ProviderRow({ provider }: { provider: StaffDoctor }) {
  const upcomingCount = provider.todaysAppointments
=======
function ProviderRow({ provider }: { provider: Provider }) {
  // Get today's appointments for this provider
  const today = new Date().toISOString().split("T")[0]
  const todayAppointments = mockAppointments.filter((apt) => apt.providerId === provider.id && apt.date === today)

  const upcomingCount = todayAppointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "checked-in",
  ).length
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30

  return (
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
          <Button variant="ghost" size="sm">
            Details
          </Button>
        </div>
      </div>
    </div>
  )
}
<<<<<<< HEAD

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
=======
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
