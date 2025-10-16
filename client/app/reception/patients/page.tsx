"use client"

import type React from "react"

import { useState } from "react"
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
import { mockPatients } from "@/lib/mock-data"
import type { Patient } from "@/lib/types"

export default function ReceptionPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>(mockPatients)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery),
  )

  const handleAddPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newPatient: Patient = {
      id: `p${patients.length + 1}`,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      insuranceProvider: formData.get("insuranceProvider") as string,
      insuranceId: formData.get("insuranceId") as string,
    }

    setPatients((prev) => [...prev, newPatient])
    setIsAddDialogOpen(false)
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
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
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
      {searchQuery && filteredPatients.length === 0 ? (
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
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
