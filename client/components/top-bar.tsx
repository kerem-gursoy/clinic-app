"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Plus, User, Menu, X } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TopBarProps {
  role: UserRole
  userName: string
  onNewAppointment: () => void
  onLogout: () => Promise<void> | void
}

const roleConfig = {
  patient: {
    label: "Patient",
    tabs: [
      { label: "Appointments", href: "/patient/appointments" },
      { label: "Files", href: "/patient/files" },
    ],
  },
  doctor: {
    label: "Doctor",
    tabs: [
      { label: "Appointments", href: "/doctor/appointments" },
      { label: "Patients", href: "/doctor/patients" },
    ],
  },
  staff: {
    label: "Staff",
    tabs: [
      { label: "Agenda", href: "/staff/appointments" },
      { label: "Patients", href: "/staff/patients" },
      { label: "Doctors", href: "/staff/doctors" },
      // `reports` will be rendered as a dropdown in the nav
      { label: "Reports", isReport: true },
    ],
  },
}

export function TopBar({ role, userName, onNewAppointment, onLogout }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const config = roleConfig[role]

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Welcome Message */}
        <div className="font-semibold text-lg">
          Welcome, {userName}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {config.tabs.map((tab) => {
            if ((tab as any).isReport) {
              return (
                <DropdownMenu key="reports">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn("rounded-full")}>{tab.label}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Reports</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => router.push('/admin/reports/appointments')}>Appointment</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push('/admin/reports/revenue')}>Revenue</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Link key={(tab as any).href} href={(tab as any).href}>
                <Button variant="ghost" size="sm" className={cn("rounded-full", pathname === (tab as any).href && "bg-muted")}>
                  {tab.label}
                </Button>
              </Link>
            )
          })}
        </nav>



        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "patient" && (
                <DropdownMenuItem onSelect={() => router.push("/patient/profile")}>Profile</DropdownMenuItem>
              )}
              {role === "doctor" && (
                <DropdownMenuItem onSelect={() => router.push("/doctor/profile")}>Profile</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card p-4">
          <nav className="flex flex-col gap-2">
            {config.tabs.map((tab) => {
              if ((tab as any).isReport) {
                return (
                  <div key="reports" className="flex flex-col gap-2">
                    <Link href="/admin/reports/appointments" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className={cn("w-full justify-start")}>Appointment Report</Button>
                    </Link>
                    <Link href="/admin/reports/revenue" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className={cn("w-full justify-start")}>Revenue Report</Button>
                    </Link>
                  </div>
                )
              }

              return (
                <Link key={(tab as any).href} href={(tab as any).href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("w-full justify-start", pathname === (tab as any).href && "bg-muted")}
                  >
                    {tab.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}