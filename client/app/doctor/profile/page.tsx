"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { apiPath } from "@/app/lib/api"
import { formatPhoneNumber } from "@/lib/utils"

interface DoctorProfile {
  doctor_id: number
  doc_fname?: string | null
  doc_minit?: string | null
  doc_lname?: string | null
  email?: string | null
  phone?: string | null
}

export default function DoctorProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Contact Info
  const [firstName, setFirstName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [doctorId, setDoctorId] = useState<number | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const res = await fetch(apiPath("/me"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error("Failed to load profile")
        }

        const data = await res.json()
        const profile = data.profile as DoctorProfile

        if (profile) {
          setDoctorId(profile.doctor_id)
          setFirstName(profile.doc_fname ?? "")
          setMiddleInitial(profile.doc_minit ?? "")
          setLastName(profile.doc_lname ?? "")
          setEmail(profile.email ?? "")
          setPhone(profile.phone ?? "")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) return

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const res = await fetch(apiPath(`/doctor/profile`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          doc_fname: firstName,
          doc_minit: middleInitial,
          doc_lname: lastName,
          email,
          phone: phone.replace(/\D/g, ""),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update contact information")
      }

      setSuccess("Contact information updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact information")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)

    if (!hasUpperCase || !hasSpecialChar) {
      setError("New password must contain at least one uppercase letter and one special character")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setIsSaving(true)

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const res = await fetch(apiPath("/doctor/password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to change password")
      }

      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your contact information and password</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      const value = e.target.value
                      setFirstName(value.charAt(0).toUpperCase() + value.slice(1))
                    }}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleInitial">Middle Initial</Label>
                  <Input
                    id="middleInitial"
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                    maxLength={1}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    const value = e.target.value
                    setLastName(value.charAt(0).toUpperCase() + value.slice(1))
                  }}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formatPhoneNumber(phone)}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/\D/g, "")
                    setPhone(rawDigits)
                  }}
                  disabled={isSaving}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Contact Information"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Must include uppercase and special character"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSaving}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSaving}
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push("/doctor/appointments")}>
            Back to Appointments
          </Button>
        </div>
      </div>
    </div>
  )
}
