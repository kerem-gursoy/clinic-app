"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiPath } from "@/app/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin } from "lucide-react"

interface RawProfile {
  patient_id?: number
  patient_fname?: string | null
  patient_minit?: string | null
  patient_lname?: string | null
  name?: string | null
  patient_email?: string | null
  email?: string | null
  phone?: string | null
  dob?: string | null
  date_of_birth?: string | null
  gender?: string | null
  gender_label?: string | null
  address?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  emergency_contact?: string | null
  created_at?: string | null
  balance?: number | string | null
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

function buildDisplayName(p: RawProfile) {
  if (p.name) return p.name
  const parts = [p.patient_fname, p.patient_minit ? `${p.patient_minit}.` : "", p.patient_lname].filter(Boolean)
  return parts.join(" ") || "Patient"
}

function buildAddress(p: RawProfile) {
  if (p.address) return p.address
  const parts = [p.address_line1, p.address_line2, p.city, p.state, p.zip_code].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

const getGenderDisplay = (gender: string | null) => {
    if (!gender) return "N/A"
    switch (gender.toString()) {
        case "1":
            return "Male"
        case "2":
            return "Female"
        case "3":
            return "Other"
        default:
            return gender
    }
}

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return null
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
}

const getToken = () =>
  typeof window !== "undefined"
    ? (localStorage.getItem("authtoken") ?? localStorage.getItem("authToken") ?? localStorage.getItem("AuthToken"))
    : null


export default function PatientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<RawProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()
        const res = await fetch(apiPath("/me"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body?.error ?? `Failed to load profile (${res.status})`)
        }
        const p: RawProfile = body.profile ?? body.user ?? body
        if (mounted) setProfile(p)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? String(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading profile…</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl border p-8 text-center">
          <p className="text-destructive mb-4">{error || "Profile not found"}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const displayName = buildDisplayName(profile)
  const email = profile.patient_email ?? profile.email ?? "N/A"
  const phone = profile.phone ?? "N/A"
  const dob = profile.dob ?? profile.date_of_birth ?? null
  const address = buildAddress(profile)
  const gender = getGenderDisplay(profile.gender_label ?? profile.gender)
  const emergency_contact = profile.emergency_contact ?? null
  const balanceFormatted = formatCurrency(profile.balance)

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Button onClick={() => router.back()} variant="ghost" className="mb-4 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/patient/profile/edit")}>Edit</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date of Birth:</span>
                <span>{formatDate(dob)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Gender:</span>
                <span>{gender}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Patient Since:</span>
                <span>{formatDate(profile.created_at ?? null)}</span>
              </div>

              {address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Address:</span>
                  <span>{address}</span>
                </div>
              )}
            </div>
          </div>

          {emergency_contact && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Emergency Contact:</span>
                <span>{emergency_contact}</span>
              </div>
            </>
          )}
          {balanceFormatted && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                 <span className="font-medium">Balance:</span>
                 <span className="font-semibold text-red-600">{balanceFormatted}</span>
               </div>
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}