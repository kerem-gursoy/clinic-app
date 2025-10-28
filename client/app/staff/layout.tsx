"use client"

<<<<<<< HEAD
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import type React from "react"
import { TopBar } from "@/components/top-bar"
import { logout, getStoredAuthUser } from "@/lib/auth"
import { useRoleGuard } from "@/hooks/use-role-guard"
=======
import type React from "react"
import { TopBar } from "@/components/top-bar"
import { useRouter } from "next/navigation"
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
<<<<<<< HEAD
  const { isChecking } = useRoleGuard("staff")
  const [userName, setUserName] = useState<string>("Guest")

  useEffect(() => {
    const user = getStoredAuthUser()
    if (user?.first_name) {
      setUserName(user.first_name)
    }
  }, [])
=======

  const handleRoleChange = (role: "patient" | "doctor" | "staff") => {
    if (role === "staff") {
      router.push("/staff/appointments")
      return
    }
    router.push(`/${role}/appointments`)
  }
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30

  const handleNewAppointment = () => {
    // TODO: Open create appointment sheet
    console.log("[v0] New appointment clicked")
  }

<<<<<<< HEAD
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Failed to log out", err)
    } finally {
      router.push("/auth/login")
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar role="staff" userName={userName} onNewAppointment={handleNewAppointment} onLogout={handleLogout} />
=======
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar role="staff" onRoleChange={handleRoleChange} onNewAppointment={handleNewAppointment} />
>>>>>>> 8864bb37d3b7286bd5cca5e0e4c70d99b2248d30
      <main className="flex-1">{children}</main>
    </div>
  )
}
