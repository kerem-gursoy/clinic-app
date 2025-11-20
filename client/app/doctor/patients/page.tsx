"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form"
import { Search, User, Phone, Mail, Calendar, Plus } from "lucide-react"
import { apiPath } from "@/app/lib/api"

interface DoctorPatientResponse {
  patient_id: number
  name: string
  email: string | null
  phone: string | null
  last_visit: string | null
}

interface DoctorPatient {
  id: string
  patientId: number
  name: string
  email: string
  phone: string
  lastVisit: string | null
}

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchPatients = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const res = await fetch(apiPath("/doctor/patients"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.patients)) {
          throw new Error("Failed to load patients")
        }
        if (cancelled) return
        setPatients(data.patients.map(mapDoctorPatient))
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setPatients([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery),
      ),
    [patients, searchQuery],
  )

  const handleBookPatient = (patient: DoctorPatient) => {
    setSelectedPatient(patient)
    setIsBookingDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsBookingDialogOpen(open)
    if (!open) {
      setSelectedPatient(null)
    }
  }

  const closeDialog = () => handleDialogChange(false)

  return (
    <>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">My Patients</h1>
          <p className="text-muted-foreground">Search and manage your patient list</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading patients…</div>
        ) : searchQuery && filteredPatients.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No patients found"
            description="Try adjusting your search terms or browse all patients."
          />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={User}
            title="No patients yet"
            description="Your patient list will appear here once you start seeing patients."
          />
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {filteredPatients.map((patient) => (
              <PatientRow key={patient.id} patient={patient} onBook={handleBookPatient} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isBookingDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl p-0" showCloseButton>
          <div className="px-6 py-6">
            <NewAppointmentForm
              initialPatientId={selectedPatient?.patientId}
              initialPatientName={selectedPatient?.name}
              onCancel={closeDialog}
              onSuccess={closeDialog}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PatientRow({ patient, onBook }: { patient: DoctorPatient; onBook: (patient: DoctorPatient) => void }) {
  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">{patient.name}</h3>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleString() : "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{patient.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent"
            onClick={() => onBook(patient)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Book
          </Button>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </div>
      </div>
    </div>
  )
}

function mapDoctorPatient(patient: DoctorPatientResponse): DoctorPatient {
  return {
    id: `doctor-patient-${patient.patient_id}`,
    patientId: patient.patient_id,
    name: patient.name,
    email: patient.email ?? "N/A",
    phone: patient.phone ?? "N/A",
    lastVisit: patient.last_visit ?? null,
  }
}
