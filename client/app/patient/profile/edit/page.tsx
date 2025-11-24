"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiPath } from "@/app/lib/api"
import { Button } from "@/components/ui/button"

interface PatientResponse {
  patient_id: number
  patient_fname?: string | null
  patient_minit?: string | null
  patient_lname?: string | null
  patient_email?: string | null
  phone?: string | null
  dob?: string | null
}

interface PatientForm {
  patientId: number
  firstName: string
  middleInitial: string
  lastName: string
  email: string
  phone: string
  dob: string | null
}

interface AddressResponse {
  address_id?: number
  patient_id?: number
  street?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

function toDateInputValue(value?: string | null): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function mapPatient(p: PatientResponse): PatientForm {
  return {
    patientId: p.patient_id,
    firstName: p.patient_fname ?? "",
    middleInitial: p.patient_minit ?? "",
    lastName: p.patient_lname ?? "",
    email: p.patient_email ?? "",
    phone: p.phone ?? "",
    dob: toDateInputValue(p.dob) ?? null,
  }
}

const getToken = () =>
  typeof window !== "undefined"
    ? (localStorage.getItem("authtoken") ?? localStorage.getItem("authToken") ?? localStorage.getItem("AuthToken"))
    : null

export default function EditProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState<PatientForm | null>(null)
  const [address, setAddress] = useState<AddressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddressExpanded, setIsAddressExpanded] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = getToken()
        const meUrl = apiPath("/me")
        const res = await fetch(meUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        let data: any = null
        try { data = await res.json() } catch {}
        if (!res.ok) throw new Error(data?.error ?? `Failed to load profile (${res.status})`)
        const profile = data.profile ?? data.user ?? data
        if (!profile) throw new Error("No profile returned")
        if (!mounted) return
        const patient = mapPatient(profile as PatientResponse)
        setForm(patient)

        // Fetch address by patientId
        try {
          const addrUrl = apiPath(`/addresses?patient_id=${encodeURIComponent(String(patient.patientId))}`)
          const addrRes = await fetch(addrUrl, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
          if (addrRes.ok) {
            let addrBody: any = null
            try { addrBody = await addrRes.json() } catch {}
            const addr = addrBody.address ?? (Array.isArray(addrBody) ? addrBody[0] : addrBody)
            if (addr) setAddress(addr as AddressResponse)
          }
        } catch (addrErr) {
          console.warn("Address fetch failed:", addrErr)
        }
      } catch (err: any) {
        if (mounted) setError(err.message ?? String(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [])

  const updateField = (k: keyof PatientForm, v: string) => {
    setForm((s) => (s ? { ...s, [k]: v } : s))
  }

  const updateAddressField = (k: keyof AddressResponse, v: string) => {
    setAddress((a) => ({ ...(a ?? {}), [k]: v }))
  }

  const saveAddress = async (patientId: number, token: string | null) => {
    if (!address) return
    const payload = {
      patient_id: patientId,
      street: address.street ?? null,
      line2: address.line2 ?? null,
      city: address.city ?? null,
      state: address.state ?? null,
      zip: address.zip ?? null,
    }

    const url = address.address_id ? apiPath(`/addresses/${address.address_id}`) : apiPath(`/addresses`)
    const method = address.address_id ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    })
    let data: any = null
    try { data = await res.json() } catch {}
    if (!res.ok) throw new Error(data?.error ?? `Address ${method} failed (${res.status})`)
  }

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form) return
    setIsSaving(true)
    setError(null)
    const token = getToken()
    const payload = {
      patient_fname: form.firstName,
      patient_lname: form.lastName,
      patient_minit: form.middleInitial,
      patient_email: form.email,
      phone: form.phone,
      dob: form.dob,
    }

    const tryPut = async (url: string) => {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const text = await res.text().catch(() => '')
      let body: any = text
      try { body = text ? JSON.parse(text) : text } catch {}
      return { ok: res.ok, status: res.status, body, url }
    }

    try {
      const primary = apiPath(`/patients/${encodeURIComponent(String(form.patientId))}`)
      let result = await tryPut(primary)

      if (!result.ok && result.status === 404) {
        const fallback = apiPath(`/staff/patients/${encodeURIComponent(String(form.patientId))}`)
        result = await tryPut(fallback)
      }

      if (!result.ok) {
        throw new Error(result.body?.error ?? result.body?.message ?? `Update failed (${result.status})`)
      }

      try {
        await saveAddress(form.patientId, token)
      } catch (addrErr: any) {
        console.warn('Address save failed', addrErr)
        setError(prev => prev ? prev + '; address: ' + String(addrErr.message || addrErr) : String(addrErr.message || addrErr))
      }

      router.push('/patient/profile')
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-6">Loading…</div>
  if (error && !form) return <div className="p-6 text-red-600">Error: {error}</div>
  if (!form) return <div className="p-6">No profile data</div>

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              className="w-full border-2 border-gray-400 rounded px-3 py-2"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium mb-1">Middle Initial</label>
            <input
              className="w-12 border-2 border-gray-400 rounded px-2 py-1 text-center"
              maxLength={1}
              value={form.middleInitial}
              onChange={(e) => updateField("middleInitial", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              className="w-full border-2 border-gray-400 rounded px-3 py-2"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border-2 border-gray-400 rounded px-3 py-2"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              className="w-full border-2 border-gray-400 rounded px-3 py-2"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            className="w-full border-2 border-gray-400 rounded px-3 py-2"
            value={form.dob ?? ""}
            onChange={(e) => updateField("dob", e.target.value)}
          />
        </div>

        <fieldset className="border-2 border-gray-400 rounded px-4 py-3">
          <legend className="text-sm font-medium cursor-pointer" onClick={() => setIsAddressExpanded((v) => !v)}>
            Address {isAddressExpanded ? "▲" : "▼"}
          </legend>

          {isAddressExpanded && (
            <div className="mt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Street</label>
                <input className="w-full border-2 border-gray-400 rounded px-3 py-2" value={address?.street ?? ""} onChange={(e) => updateAddressField("street", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Line 2</label>
                <input className="w-full border-2 border-gray-400 rounded px-3 py-2" value={address?.line2 ?? ""} onChange={(e) => updateAddressField("line2", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input className="w-full border-2 border-gray-400 rounded px-3 py-2" value={address?.city ?? ""} onChange={(e) => updateAddressField("city", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input className="w-full border-2 border-gray-400 rounded px-3 py-2" value={address?.state ?? ""} onChange={(e) => updateAddressField("state", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input className="w-full border-2 border-gray-400 rounded px-3 py-2" value={address?.zip ?? ""} onChange={(e) => updateAddressField("zip", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => router.push("/patient/profile")} className="px-4 py-2 border rounded">
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}