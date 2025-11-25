"use client"

import { useState, useEffect } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiPath } from "@/app/lib/api"
import { formatPhoneNumber, formatLicenseNumber } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

interface Doctor {
  doctor_id: number
  doc_fname: string
  doc_lname: string
  doc_minit?: string | null
  email: string
  phone?: string | null
  gender?: number | null
  license_no?: string | null
  ssn?: string | null
}

interface NewDoctorFormProps {
  onCancel?: () => void
  onSuccess?: () => void
  doctor?: Doctor
}

export function NewDoctorForm({ onCancel, onSuccess, doctor }: NewDoctorFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [gender, setGender] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [ssn, setSsn] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when doctor prop changes
  useEffect(() => {
    if (doctor) {
      setFirstName(doctor.doc_fname || "")
      setLastName(doctor.doc_lname || "")
      setMiddleInitial(doctor.doc_minit || "")
      setEmail(doctor.email || "")
      setPhone(doctor.phone || "")
      const genderValue = doctor.gender != null ? String(doctor.gender) : ""
      setGender(genderValue)
      const licMatch = doctor.license_no?.match(/\d+/)
      setLicenseNumber(licMatch ? licMatch[0] : "")
      setSsn(doctor.ssn || "")
    } else {
      resetForm()
    }
  }, [doctor])

  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setMiddleInitial("")
    setEmail("")
    setPhone("")
    setGender("")
    setLicenseNumber("")
    setSsn("")
    setPassword("")
    setConfirmPassword("")
  }

  const capitalizeFirst = (str: string) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const validatePassword = (pass: string) => {
    if (!pass) return true // Allow empty if not required
    const hasUpperCase = /[A-Z]/.test(pass)
    const hasLowerCase = /[a-z]/.test(pass)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
    return hasUpperCase && hasLowerCase && hasSpecialChar
  }

  const handleDelete = async () => {
    if (!doctor) return

    setIsDeleting(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath(`/doctors/${doctor.doctor_id}`), {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to delete doctor")
      }

      onSuccess?.()
    } catch (err) {
      console.error(err)
      setError((err as Error).message || "Failed to delete doctor")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required")
      return
    }

    if (licenseNumber.length !== 5) {
      setError("License number must contain exactly 5 digits (format LIC-12345)")
      return
    }

    if (!ssn.trim()) {
      setError("SSN is required")
      return
    }

    if (ssn.length > 10) {
      setError("SSN must be at most 10 characters")
      return
    }

    if (!doctor && !password) {
      setError("Password is required")
      return
    }

    if (password && !validatePassword(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one special character")
      return
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        doc_fname: capitalizeFirst(firstName.trim()),
        doc_lname: capitalizeFirst(lastName.trim()),
        doc_minit: middleInitial || null,
        email,
        phone: phone || null,
        gender: gender ? Number(gender) : null,
        license_no: licenseNumber ? `LIC-${licenseNumber}` : null,
        ssn,
        ...(doctor ? {} : { availability: 1 }),
      }

      if (password) {
        payload.password = password
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath(doctor ? `/doctors/${doctor.doctor_id}` : "/doctors"), {
        method: doctor ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || `Failed to ${doctor ? "update" : "create"} doctor`)
      }

      if (!doctor) {
        resetForm()
      }
      onSuccess?.()
    } catch (err) {
      console.error(err)
      setError((err as Error).message || `Failed to ${doctor ? "update" : "create"} doctor`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold">{doctor ? "Edit Doctor" : "Add New Doctor"}</h2>
        <p className="text-sm text-muted-foreground">
          {doctor ? "Update the provider's details." : "Provide the provider's details to onboard them."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => {
                const value = e.target.value
                if (value.length > 0) {
                  setFirstName(value.charAt(0).toUpperCase() + value.slice(1))
                } else {
                  setFirstName(value)
                }
              }}
              placeholder="Jane"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleInitial">Middle Initial</Label>
            <Input
              id="middleInitial"
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 1))}
              placeholder="A"
              maxLength={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              key={`gender-${doctor?.doctor_id || 'new'}-${gender}`} 
              value={gender} 
              onValueChange={setGender}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Female</SelectItem>
                <SelectItem value="2">Male</SelectItem>
                <SelectItem value="3">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@clinic.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formatPhoneNumber(phone)}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, "")
                setPhone(rawDigits)
              }}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={formatLicenseNumber(licenseNumber)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 5)
                setLicenseNumber(digits)
              }}
              placeholder="LIC-12345"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssn">SSN</Label>
            <Input
              id="ssn"
              inputMode="numeric"
              pattern="\d*"
              value={ssn}
              onChange={(e) => setSsn(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="1234567890"
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {doctor && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!doctor}
            />
            <p className="text-xs text-muted-foreground">Must contain uppercase, lowercase, and special character</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password {doctor && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!doctor}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (doctor ? "Updating…" : "Creating…") : doctor ? "Update Doctor" : "Create Doctor"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {doctor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this doctor? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2 justify-end">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  )
}