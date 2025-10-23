"use client"

import type React from "react"
import { TopBar } from "@/components/top-bar"
import { useRouter } from "next/navigation"

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleRoleChange = (role: "patient" | "doctor" | "staff") => {
    if (role === "staff") {
      router.push("/staff/appointments")
      return
    }
    router.push(`/${role}/appointments`)
  }

  const handleNewAppointment = () => {
    // TODO: Open create appointment sheet
    console.log("[v0] New appointment clicked")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar role="staff" onRoleChange={handleRoleChange} onNewAppointment={handleNewAppointment} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
