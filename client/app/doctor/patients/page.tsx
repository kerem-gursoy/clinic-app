"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Search, User, Phone, Mail, Calendar, Plus } from "lucide-react"
import { mockPatients } from "@/lib/mock-data"
import type { Patient } from "@/lib/types"

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients] = useState<Patient[]>(mockPatients)

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery),
  )

  return (
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
      {searchQuery && filteredPatients.length === 0 ? (
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
            <PatientRow key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientRow({ patient }: { patient: Patient }) {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()

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
                  {age} years old • DOB: {new Date(patient.dateOfBirth).toLocaleDateString("en-US")}
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

            {patient.insuranceProvider && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Insurance: </span>
                <span className="font-medium">
                  {patient.insuranceProvider} ({patient.insuranceId})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-transparent">
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
