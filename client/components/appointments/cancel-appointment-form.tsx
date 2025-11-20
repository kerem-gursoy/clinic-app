"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getStoredAuthUser } from "@/lib/auth"
import { apiPath } from "@/app/lib/api"

interface CancelAppointmentFormProps {
    appointmentId: number
    onCancel?: () => void
    onSuccess?: () => void
}
export function CancelAppointmentForm({ appointmentId, onCancel, onSuccess }: CancelAppointmentFormProps) {
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [reason, setReason] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<string | null>(null)

    const handleClose = () => {
        if (onCancel) {
            onCancel()
        } else {
            router.back()
        }
    }

    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess()
        } else {
            router.back()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors(null)
        setIsSubmitting(true)

        try {
            const token =
                typeof window !== "undefined"
                    ? window.localStorage.getItem("authToken")
                    : null

            // NOTE: use canonical status "canceled" (single 'l') to match DB FK values
            const payload: any = { status: "canceled" }
            if (reason && reason.trim().length > 0) payload.reason = reason.trim()

            const res = await fetch(apiPath(`/appointments/${appointmentId}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                credentials: "include",
                body: JSON.stringify(payload)
            })

            const body = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(body?.error || "Failed to cancel appointment")
            }

            localStorage.setItem("appointments_refresh", String(Date.now()))
            handleSuccess()
        } catch (err) {
            console.error(err)
            alert((err as any)?.message ?? "Unable to cancel appointment")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="border-b pb-4">
                <h2 className="text-2xl font-semibold">Cancel Appointment</h2>
                <p className="text-sm text-muted-foreground">
                    This action will permanently mark the appointment as cancelled.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="patient">This appointment will be cancelled.</Label>
                    <div className="space-y-2">
                    <Input
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for cancel"
                    />
                </div>
                </div>
                {errors && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border">
                        {errors}
                    </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Cancelling..." : "Cancel Appointment"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </form>
        </div>
    )
}