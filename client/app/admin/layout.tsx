"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"

import { TopBar } from "@/components/top-bar"
import { useRoleGuard } from "@/hooks/use-role-guard"
import { getStoredAuthUser, logout } from "@/lib/auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Admin views share the staff role; reuse the staff guard/top bar.
  const { isChecking } = useRoleGuard("staff")
  const [userName, setUserName] = useState<string>("Guest")

  useEffect(() => {
    const user = getStoredAuthUser()
    if (user?.first_name) {
      setUserName(user.first_name)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Failed to log out", err)
    } finally {
      router.push("/auth/login")
    }
  }

  const handleNewAppointment = () => {
    // Placeholder for future admin-level quick create
    console.log("New appointment click (admin)")
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
      <main className="flex-1">{children}</main>
    </div>
  )
}
