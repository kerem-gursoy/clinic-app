"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, User, Phone, Mail, Calendar, Plus } from "lucide-react"
import { apiPath } from "@/app/lib/api"

const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
const staffId = Number(authUser?.user_id);

interface StaffPatientResponse {
  patient_id: number
  patient_fname: string
  patient_lname: string
  patient_minit?: string | null
  dob?: string | null
  gender?: string | null
  phone?: string | null
  patient_email?: string | null
  address_id?: number | null
  balance?: number | null
  created_at?: string | null
  prim_doctor?: string | null
}

interface StaffPatient {
  id: string
  patientId: number
  name: string
  email: string
  phone: string
  dob: string | null
}

export default function StaffPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<StaffPatient[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchPatients = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const res = await fetch(apiPath("/staff/patients"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.patients)) {
          throw new Error("Failed to load patients")
        }
        if (cancelled) return
        setPatients(data.patients.map(mapPatient))
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

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newPatientData = {
      patient_fname: formData.get("fname"),
      patient_lname: formData.get("lname"),
      patient_minit: formData.get("minit") || null,
      dob: formData.get("dateOfBirth"),
      gender: null,
      phone: formData.get("phone"),
      address_id: null,
      balance: 0,
      created_by: staffId,
      med_id: null,
      patient_email: formData.get("email"),
      prim_doctor: null,
      password: "secret123",
    }

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath("/patients"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newPatientData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to create patient: ${errorText}`)
      }

      const result = await res.json()

      const nameParts = [
        newPatientData.patient_fname,
        newPatientData.patient_minit ? `${newPatientData.patient_minit}.` : "",
        newPatientData.patient_lname,
      ]
        .filter(Boolean)
        .join(" ")

      setPatients((prev) => [
        ...prev,
        {
          id: `patient-${result.patientId}`,
          patientId: result.patientId,
          fname: newPatientData.patient_fname as string,
          lname: newPatientData.patient_lname as string,
          minit: newPatientData.patient_minit as string,
          email: newPatientData.patient_email as string,
          phone: newPatientData.phone as string,
          dob: newPatientData.dob as string,
          name: nameParts,
        },
      ])
      //e.currentTarget.reset()
      setIsAddDialogOpen(false)
      
    } catch (err) {
      console.error(err)
      alert("There was an error creating the patient.")
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Patient Management</h1>
          <p className="text-muted-foreground">Search and manage patient records</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddPatient}>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>Enter the patient's information to create a new record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fname">First Name *</Label>
                  <Input id="fname" name="fname" placeholder="John" required />
                  <Label htmlFor="minit">Middle Initial</Label>
                  <Input maxLength={1} id="minit" name="minit" placeholder="M" />
                  <Label htmlFor="lname">Last Name *</Label>
                  <Input id="lname" name="lname" placeholder="Doe" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input id="insuranceProvider" name="insuranceProvider" placeholder="Blue Cross" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insuranceId">Insurance ID</Label>
                  <Input id="insuranceId" name="insuranceId" placeholder="BC123456789" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Patient</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading patient list…</div>
      ) : searchQuery && filteredPatients.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No patients found"
          description="Try adjusting your search terms or add a new patient."
        />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={User}
          title="No patients yet"
          description="Add your first patient to get started."
          action={{
            label: "Add Patient",
            onClick: () => setIsAddDialogOpen(true),
          }}
        />
      ) : (
        <div className="bg-card rounded-xl border divide-y">
          {filteredPatients.map((patient) => (
            <PatientRow key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientRow({ patient }: { patient: StaffPatient }) {
  const age =
    patient.dob && !Number.isNaN(new Date(patient.dob).getTime())
      ? new Date().getFullYear() - new Date(patient.dob).getFullYear()
      : null

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
                <span>
                  {age !== null ? `${age} years old • ` : ""}
                  DOB: {patient.dob ? new Date(patient.dob).toLocaleDateString("en-US") : "Unknown"}
                </span>
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

            {/* Insurance details not yet available from API */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-transparent">
            <Plus className="h-4 w-4 mr-1" />
            Book
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}

function mapPatient(patient: StaffPatientResponse): StaffPatient {
  return {
    id: `patient-${patient.patient_id}`,
    patientId: patient.patient_id,
    name: patient.name,
    email: patient.email ?? "N/A",
    phone: patient.phone ?? "N/A",
    dob: patient.dob ?? null,
  }
}
