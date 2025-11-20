"use client"

import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiPath } from "@/app/lib/api"
import { formatPhoneNumber, formatLicenseNumber } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

interface NewDoctorFormProps {
  onCancel?: () => void
  onSuccess?: () => void
  doctorId?: number
}

export function NewDoctorForm({ onCancel, onSuccess, doctorId }: NewDoctorFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [email, setEmail] = useState("")
  // phone stores raw digits; displayed formatted
  const [phone, setPhone] = useState("")
  // gender stored as string "1"|"2"|"3"
  const [gender, setGender] = useState("")
  // licenseNumber stores only digits (up to 5). display uses formatLicenseNumber(licenseNumber)
  const [licenseNumber, setLicenseNumber] = useState("")
  const [ssn, setSsn] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleDelete = async () => {
    if (!doctorId) return

    setIsDeleting(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath(`/doctors/${doctorId}`), {
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

    // licenseNumber must be exactly 5 digits
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

    if (!password) {
      setError("Password is required")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        doc_fname: firstName,
        doc_lname: lastName,
        doc_minit: middleInitial || null,
        email,
        phone: phone || null,
        gender: gender ? Number(gender) : null,
        // server expects LIC-12345 string
        license_no: licenseNumber ? `LIC-${licenseNumber}` : null,
        ssn,
        availability: 1,
        password,
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const res = await fetch(apiPath("/doctors"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || "Failed to create doctor")
      }

      resetForm()
      onSuccess?.()
    } catch (err) {
      console.error(err)
      setError((err as Error).message || "Failed to create doctor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold">Add New Doctor</h2>
        <p className="text-sm text-muted-foreground">Provide the provider&apos;s details to onboard them.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value.replace(/[^a-zA-Z]/g, "").charAt(0).toUpperCase() + e.target.value.replace(/[^a-zA-Z]/g, "").slice(1).toLowerCase())}
              placeholder="Jane"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value.replace(/[^a-zA-Z]/g, "").charAt(0).toUpperCase() + e.target.value.replace(/[^a-zA-Z]/g, "").slice(1).toLowerCase())}
              placeholder="Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleInitial">Middle Initial</Label>
            <Input
              id="middleInitial"
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value)}
              placeholder="A"
              maxLength={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
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
                setPhone(rawDigits.slice(0, 10))
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
              value={ssn}
              onChange={(e) => setSsn(e.target.value.slice(0, 10))}
              placeholder="1234567890"
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Doctor"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {doctorId && (
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