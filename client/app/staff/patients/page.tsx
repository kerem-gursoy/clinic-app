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
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form"
import { formatPhoneNumber } from "@/lib/utils"

const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
const staffId = Number(authUser?.user_id);

interface StaffPatientResponse {
  patient_id: number
  // server may return either { patient_fname, patient_minit, patient_lname }
  // (detailed row) OR a simplified { name } field for staff listing endpoints
  patient_fname?: string
  patient_lname?: string
  patient_minit?: string | null
  name?: string
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
  patient_fname: string
  patient_minit?: string | null
  patient_lname: string
  name: string
  email: string
  phone: string
  dob: string | null
}

export default function StaffPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<StaffPatient[]>([])
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [apptPatientId, setApptPatientId] = useState<number | null>(null)
  const [apptPatientName, setApptPatientName] = useState<string | null>(null)
  
  // Add Patient form state
  const [firstName, setFirstName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [ssn, setSsn] = useState("")
  const [password, setPassword] = useState("")

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

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return patients.filter((patient) => {
      const fullName = [patient.patient_fname, patient.patient_minit ? `${patient.patient_minit}.` : "", patient.patient_lname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        fullName.includes(q) ||
        patient.email.toLowerCase().includes(q) ||
        patient.phone.includes(searchQuery)
      )
    })
  }, [patients, searchQuery])

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      alert("First and last name are required")
      return
    }

    if (!email.trim()) {
      alert("Email is required")
      return
    }

    if (!phone.trim()) {
      alert("Phone is required")
      return
    }

    if (!dob) {
      alert("Date of birth is required")
      return
    }

    if (!ssn.trim()) {
      alert("SSN is required")
      return
    }

    if (!password) {
      alert("Password is required")
      return
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasSpecialChar) {
      alert("Password must contain at least one uppercase letter, one lowercase letter, and one special character")
      return
    }

    const newPatientData = {
      patient_fname: firstName,
      patient_lname: lastName,
      patient_minit: middleInitial || null,
      dob: dob,
      patient_ssn: ssn,
      gender: null,
      phone: phone.replace(/\D/g, ""),
      address_id: null,
      balance: 0,
      created_by: staffId,
      med_id: null,
      patient_email: email,
      prim_doctor: null,
      password: password,
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
          patient_fname: newPatientData.patient_fname as string,
          patient_minit: newPatientData.patient_minit as string,
          patient_lname: newPatientData.patient_lname as string,
          name: nameParts,
          email: newPatientData.patient_email as string,
          phone: newPatientData.phone as string,
          dob: newPatientData.dob as string,
        },
      ])
      
      // Reset form
      setFirstName("")
      setMiddleInitial("")
      setLastName("")
      setEmail("")
      setPhone("")
      setDob("")
      setSsn("")
      setPassword("")
      setIsAddDialogOpen(false)
      
    } catch (err) {
      console.error(err)
      alert("There was an error creating the patient.")
    }
  }

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
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleAddPatient}>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>Enter the patient's information to create a new record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="fname" className="text-sm">First Name *</Label>
                  <Input
                    id="fname"
                    value={firstName}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length > 0) {
                        setFirstName(value.charAt(0).toUpperCase() + value.slice(1))
                      } else {
                        setFirstName(value)
                      }
                    }}
                    placeholder="John"
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="minit" className="text-sm">Middle Initial</Label>
                  <Input
                    id="minit"
                    maxLength={1}
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                    placeholder="M"
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lname" className="text-sm">Last Name *</Label>
                  <Input
                    id="lname"
                    value={lastName}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length > 0) {
                        setLastName(value.charAt(0).toUpperCase() + value.slice(1))
                      } else {
                        setLastName(value)
                      }
                    }}
                    placeholder="Doe"
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-sm">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formatPhoneNumber(phone)}
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, "")
                      setPhone(rawDigits)
                    }}
                    placeholder="(555) 123-4567"
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ssn" className="text-sm">SSN *</Label>
                  <Input
                    id="ssn"
                    type="text"
                    value={ssn}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
                      setSsn(digits)
                    }}
                    placeholder="9 digits"
                    maxLength={9}
                    required
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password" className="text-sm">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Must include uppercase, lowercase, and special character"
                    required
                    className="h-9"
                  />
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
              onBook={(id: number, name: string) => {
                setApptPatientId(id)
                setApptPatientName(name)
                setShowNewAppointment(true)
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="max-w-3xl p-0" showCloseButton>
          <div className="px-6 py-6">
            <NewAppointmentForm
              initialPatientId={apptPatientId ?? undefined}
              initialPatientName={apptPatientName ?? undefined}
              onCancel={() => setShowNewAppointment(false)}
              onSuccess={() => {
                setShowNewAppointment(false)
                setFlash({ text: "Appointment created", type: "success" })
                window.setTimeout(() => setFlash(null), 4000)
              }}
              onNotify={(text: string, type: "success" | "error" = "success") => {
                setFlash({ text, type })
                window.setTimeout(() => setFlash(null), 4000)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PatientRow({
  patient,
  onUpdate,
  onDelete,
  onNotify,
  onBook,
}: {
  patient: StaffPatient
  onUpdate: (p: StaffPatient) => void
  onDelete: (id: number) => void
  onNotify?: (text: string, type?: "success" | "error") => void
  onBook?: (id: number, name: string) => void
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

  // Build display name using explicit name parts so middle initial shows with a period
  const parts = [
    patient.patient_fname,
    patient.patient_minit ? `${patient.patient_minit}.` : "",
    patient.patient_lname,
  ].filter(Boolean)
  const displayName = parts.join(" ") || patient.name

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
            <h3 className="font-semibold mb-1">{displayName}</h3>

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
                <span>{formatPhoneNumber(patient.phone)}</span>
              </div>
            </div>

            {/* Insurance details not yet available from API */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-transparent" onClick={() => onBook?.(patient.patientId, displayName)}>
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

function mapPatient(patient: StaffPatientResponse): StaffPatient {
  // If server did not give separate name fields, try to parse them from the
  // provided display `name` so we can always render a middle initial with a period.
  let fname = patient.patient_fname ?? ""
  let minit = patient.patient_minit ?? null
  let lname = patient.patient_lname ?? ""

  if (!fname && patient.name) {
    const parts = String(patient.name).trim().split(/\s+/)
    if (parts.length === 1) {
      fname = parts[0]
      minit = null
      lname = ""
    } else if (parts.length === 2) {
      fname = parts[0]
      minit = null
      lname = parts[1]
    } else {
      const first = parts[0]
      const maybeM = parts[1].replace(/\./g, "")
      const rest = parts.slice(2).join(" ")
      if (maybeM.length === 1) {
        fname = first
        minit = maybeM
        lname = rest
      } else {
        fname = first
        minit = null
        lname = parts.slice(1).join(" ")
      }
    }
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
