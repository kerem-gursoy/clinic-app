"use client"

import { useRouter } from "next/navigation"

import type React from "react"
import { TopBar } from "@/components/top-bar"
import { logout } from "@/lib/auth"

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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Failed to log out", err)
    } finally {
      router.push("/auth/login")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        role="staff"
        onRoleChange={handleRoleChange}
        onNewAppointment={handleNewAppointment}
        onLogout={handleLogout}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
