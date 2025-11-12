"use client"

import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { NewAppointmentForm } from "@/components/appointments/new-appointment-form"

export default function NewAppointmentPage() {
  const router = useRouter()

  const handleClose = () => router.back()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl rounded-xl border bg-card shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full border bg-background/80 p-2 text-muted-foreground transition hover:text-foreground"
          aria-label="Close new appointment form"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="px-6 py-6">
          <NewAppointmentForm onCancel={handleClose} onSuccess={handleClose} />
        </div>
      </div>
    </div>
  )
}
