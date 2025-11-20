"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiPath } from "@/app/lib/api"

interface NewDoctorFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export function NewDoctorForm({ onCancel, onSuccess }: NewDoctorFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required")
      return
    }
    if (!licenseNumber.trim()) {
      setError("License number is required")
      return
    }
    if (!ssn.trim()) {
      setError("SSN is required")
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
        gender: gender || null,
        license_no: licenseNumber,
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
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            <Input
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Female"
            />
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="LIC-12345"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssn">SSN</Label>
            <Input
              id="ssn"
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              placeholder="123456789"
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
        </div>
      </form>
    </div>
  )
}
