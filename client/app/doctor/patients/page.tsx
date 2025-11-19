"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Phone, Mail, Calendar, Plus, X, Filter } from "lucide-react"
import { apiPath } from "@/app/lib/api"

const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
const staffId = Number(authUser?.user_id);

interface StaffPatientResponse {
  patient_id: number
  name: string
  email: string | null
  phone: string | null
  last_visit: string | null
  date_of_birth?: string | null
  medications?: string[]
  allergies?: string[]
}

interface StaffPatient {
  id: string
  patientId: number
  patient_fname: string
  patient_minit?: string | null
  patient_lname: string
  name: string
  email: string
  phone: string
  lastVisit: string | null
  dateOfBirth?: string | null
  medications?: string[]
  allergies?: string[]
}

interface FilterOptions {
  startDate: string
  endDate: string
  minAge: string
  maxAge: string
  selectedMedications: string[]
  selectedAllergies: string[]
}

interface Medication {
  id: number
  name: string
}

interface Allergy {
  id: number
  name: string
}

export default function StaffPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<StaffPatient[]>([])
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: "",
    endDate: "",
    minAge: "",
    maxAge: "",
    selectedMedications: [],
    selectedAllergies: []
  })

  useEffect(() => {
    let cancelled = false

    const fetchPatients = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        
        // Fetch patients
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
        
        // Fetch medications and allergies for filters
        try {
          const [medsRes, allergiesRes] = await Promise.all([
            fetch(apiPath("/medications"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            }),
            fetch(apiPath("/allergies"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            })
          ])
          
          if (medsRes.ok) {
            const medsData = await medsRes.json()
            setMedications(medsData.medications || [])
          }
          
          if (allergiesRes.ok) {
            const allergiesData = await allergiesRes.json()
            setAllergies(allergiesData.allergies || [])
          }
        } catch (filterErr) {
          console.warn("Failed to load filter data:", filterErr)
        }
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

  const calculateAge = (dateOfBirth: string | null | undefined): number => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        // Text search filter
        const matchesSearch = searchQuery === "" ||
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery)
        
        // Age filter
        const age = calculateAge(patient.dateOfBirth)
        const matchesAge = (filters.minAge === "" || age >= parseInt(filters.minAge)) &&
                          (filters.maxAge === "" || age <= parseInt(filters.maxAge))
        
        // Appointment date filter (simplified - would need appointment data)
        const matchesDateRange = true // TODO: Implement when appointment data is available
        
        // Medication filter
        const matchesMedications = filters.selectedMedications.length === 0 ||
          (patient.medications && filters.selectedMedications.some(med => 
            patient.medications?.includes(med)
          ))
        
        // Allergy filter
        const matchesAllergies = filters.selectedAllergies.length === 0 ||
          (patient.allergies && filters.selectedAllergies.some(allergy => 
            patient.allergies?.includes(allergy)
          ))
        
        return matchesSearch && matchesAge && matchesDateRange && matchesMedications && matchesAllergies
      }),
    [patients, searchQuery, filters],
  )

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Flash message (fixed, above dialogs) */}
      {flash ? (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center pointer-events-none px-4">
          <div
            role="status"
            className={`pointer-events-auto w-full max-w-3xl rounded-md p-3 border ${
              flash.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>{flash.text}</div>
              <button
                aria-label="dismiss"
                onClick={() => setFlash(null)}
                className="ml-4 text-sm opacity-80 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        
        {/* Clear Filters Button */}
        {(filters.selectedMedications.length > 0 || filters.selectedAllergies.length > 0 || 
          filters.minAge || filters.maxAge || filters.startDate || filters.endDate) && (
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                startDate: "",
                endDate: "",
                minAge: "",
                maxAge: "",
                selectedMedications: [],
                selectedAllergies: []
              })}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
        
        {/* Active Filters Display */}
        {(filters.selectedMedications.length > 0 || filters.selectedAllergies.length > 0 || 
          filters.minAge || filters.maxAge || filters.startDate || filters.endDate) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.selectedMedications.map((med) => (
              <Badge key={med} variant="secondary" className="flex items-center gap-1">
                Medication: {med}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    selectedMedications: prev.selectedMedications.filter(m => m !== med)
                  }))}
                />
              </Badge>
            ))}
            {filters.selectedAllergies.map((allergy) => (
              <Badge key={allergy} variant="secondary" className="flex items-center gap-1">
                Allergy: {allergy}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    selectedAllergies: prev.selectedAllergies.filter(a => a !== allergy)
                  }))}
                />
              </Badge>
            ))}
            {(filters.minAge || filters.maxAge) && (
              <Badge variant="secondary">
                Age: {filters.minAge || '0'}-{filters.maxAge || '∞'}
              </Badge>
            )}
            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary">
                Appointments: {filters.startDate || 'any'} to {filters.endDate || 'any'}
              </Badge>
            )}
          </div>
        )}
        
        {/* Filter Panel */}
        <Card className="mb-4">
          <CardContent className="px-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-medium">Filter by:</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Appointment Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment Period</label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Age Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Range</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min Age"
                    value={filters.minAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max Age"
                    value={filters.maxAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Medications */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Medications</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value && !filters.selectedMedications.includes(e.target.value)) {
                      setFilters(prev => ({
                        ...prev,
                        selectedMedications: [...prev.selectedMedications, e.target.value]
                      }))
                    }
                    e.target.value = ""
                  }}
                >
                  <option value="">Select medication...</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.name}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value && !filters.selectedAllergies.includes(e.target.value)) {
                      setFilters(prev => ({
                        ...prev,
                        selectedAllergies: [...prev.selectedAllergies, e.target.value]
                      }))
                    }
                    e.target.value = ""
                  }}
                >
                  <option value="">Select allergy...</option>
                  {allergies.map((allergy) => (
                    <option key={allergy.id} value={allergy.name}>
                      {allergy.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <PatientRow
              key={patient.id}
              patient={patient}
              onUpdate={(updated) =>
                setPatients((prev) => prev.map((p) => (p.patientId === updated.patientId ? updated : p)))
              }
              onDelete={(id: number) => setPatients((prev) => prev.filter((p) => p.patientId !== id))}
              onNotify={(text: string, type: "success" | "error" = "success") => {
                setFlash({ text, type })
                window.setTimeout(() => setFlash(null), 4000)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientRow({
  patient,
  onUpdate,
  onDelete,
  onNotify,
}: {
  patient: StaffPatient
  onUpdate: (p: StaffPatient) => void
  onDelete: (id: number) => void
  onNotify?: (text: string, type?: "success" | "error") => void
}) {
  const age =
    patient.dob && !Number.isNaN(new Date(patient.dob).getTime())
      ? new Date().getFullYear() - new Date(patient.dob).getFullYear()
      : null

  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(patient.patient_fname)
  const [middleInitial, setMiddleInitial] = useState(patient.patient_minit ?? "")
  const [lastName, setLastName] = useState(patient.patient_lname)
  const [email, setEmail] = useState(patient.email)
  const [phone, setPhone] = useState(patient.phone)
  const [dob, setDob] = useState(patient.dob ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Keep local state in sync if parent changes the patient
  useEffect(() => {
    // Prefer explicit fname/minit/lname if available, otherwise parse the display name
    if (patient.patient_fname) {
      setFirstName(patient.patient_fname)
      setMiddleInitial(patient.patient_minit ?? "")
      setLastName(patient.patient_lname)
    } else if (patient.name) {
      const parts = String(patient.name).trim().split(/\s+/)
      if (parts.length === 1) {
        setFirstName(parts[0])
        setMiddleInitial("")
        setLastName("")
      } else if (parts.length === 2) {
        setFirstName(parts[0])
        setMiddleInitial("")
        setLastName(parts[1])
      } else {
        // e.g. [First, M, Last...]
        const first = parts[0]
        const maybeM = parts[1].replace(/\./g, "")
        const rest = parts.slice(2).join(" ")
        if (maybeM.length === 1) {
          setFirstName(first)
          setMiddleInitial(maybeM)
          setLastName(rest)
        } else {
          // treat middle as part of last name
          setFirstName(first)
          setMiddleInitial("")
          setLastName(parts.slice(1).join(" "))
        }
      }
    } else {
      setFirstName("")
      setMiddleInitial("")
      setLastName("")
    }
    setEmail(patient.email)
    setPhone(patient.phone)
    setDob(patient.dob ?? "")
  }, [patient])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload: any = {
        patient_fname: firstName,
        patient_minit: middleInitial || null,
        patient_lname: lastName,
        patient_email: email,
        phone,
        dob: dob || null,
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath(`/patients/${patient.patientId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || "Failed to update patient")
      }

      // Update local parent state with our edited values
      const displayName = [payload.patient_fname, payload.patient_minit ? `${payload.patient_minit}.` : "", payload.patient_lname]
        .filter(Boolean)
        .join(" ")

      const updated: StaffPatient = {
        id: patient.id,
        patientId: patient.patientId,
        patient_fname: payload.patient_fname,
        patient_minit: payload.patient_minit,
        patient_lname: payload.patient_lname,
        name: displayName,
        email,
        phone,
        dob: dob || null,
      }

      onUpdate(updated)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("There was an error updating the patient.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    // trigger in-app confirmation UI instead of browser confirm()
    setConfirmingDelete(true)
  }

  const performDelete = async () => {
    setIsSaving(true)
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const res = await fetch(apiPath(`/patients/${patient.patientId}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || "Failed to delete patient")
      }

      // Notify parent to remove the patient from the list
      onDelete(patient.patientId)
      onNotify?.("Patient deleted", "success")
      setOpen(false)
      setConfirmingDelete(false)
    } catch (err) {
      console.error(err)
      onNotify?.("There was an error deleting the patient.", "error")
    } finally {
      setIsSaving(false)
    }
  }

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
            {/* Build display name using explicit name parts so middle initial shows with a period */}
            {(() => {
              const parts = [
                patient.patient_fname,
                patient.patient_minit ? `${patient.patient_minit}.` : "",
                patient.patient_lname,
              ].filter(Boolean)
              const displayName = parts.join(" ") || patient.name
              return <h3 className="font-semibold mb-1">{displayName}</h3>
            })()}

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

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Edit Patient</DialogTitle>
                  <div className="text-sm text-muted-foreground">Update patient details and save.</div>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`fname-${patient.patientId}`}>First</Label>
                        <Input
                          id={`fname-${patient.patientId}`}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`minit-${patient.patientId}`}>M.I.</Label>
                        <Input
                          id={`minit-${patient.patientId}`}
                          maxLength={1}
                          value={middleInitial}
                          onChange={(e) => setMiddleInitial(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`lname-${patient.patientId}`}>Last</Label>
                        <Input
                          id={`lname-${patient.patientId}`}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`dob-${patient.patientId}`}>Date of Birth</Label>
                    <Input
                      id={`dob-${patient.patientId}`}
                      type="date"
                      value={dob ?? ""}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`email-${patient.patientId}`}>Email</Label>
                    <Input
                      id={`email-${patient.patientId}`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`phone-${patient.patientId}`}>Phone</Label>
                    <Input
                      id={`phone-${patient.patientId}`}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  {confirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground mr-4">Are you sure you want to delete this patient?</div>
                      <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button type="button" variant="destructive" onClick={performDelete} disabled={isSaving}>
                        {isSaving ? "Deleting..." : "Confirm Delete"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSaving}>
                        Delete
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
    dateOfBirth: patient.date_of_birth ?? null,
    medications: patient.medications ?? [],
    allergies: patient.allergies ?? [],
  }

  const displayName = [fname, minit ? `${minit}.` : "", lname].filter(Boolean).join(" ") || (patient.name ?? "")

  return {
    id: `patient-${patient.patient_id}`,
    patientId: patient.patient_id,
    patient_fname: fname,
    patient_minit: minit,
    patient_lname: lname,
    name: displayName,
    email: patient.patient_email ?? (patient as any).email ?? "N/A",
    phone: patient.phone ?? "N/A",
    dob: patient.dob ?? null,
  }
}