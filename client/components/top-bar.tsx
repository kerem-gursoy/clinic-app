"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Plus, Search, User, Menu, X } from "lucide-react"
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
      { label: "Other", href: "/patient/other" },
    ],
  },
  doctor: {
    label: "Doctor",
    tabs: [
      { label: "Appointments", href: "/doctor/appointments" },
      { label: "Patients", href: "/doctor/patients" },
      { label: "Medical Records", href: "/doctor/medical-records" },
      { label: "Other", href: "/doctor/other" },
    ],
  },
  staff: {
    label: "Staff",
    tabs: [
      { label: "Agenda", href: "/staff/appointments" },
      { label: "Patients", href: "/staff/patients" },
      { label: "Doctors", href: "/staff/doctors" },
      { label: "Other", href: "/staff/other" },
    ],
  },
}

export function TopBar({ role, userName, onNewAppointment, onLogout }: TopBarProps) {
  const pathname = usePathname()
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
          {config.tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <Button variant="ghost" size="sm" className={cn("rounded-full", pathname === tab.href && "bg-muted")}>
                {tab.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search... (⌘K)" className="pl-9 rounded-full" />
          </div>
        </div>

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
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
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
            {config.tabs.map((tab) => (
              <Link key={tab.href} href={tab.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("w-full justify-start", pathname === tab.href && "bg-muted")}
                >
                  {tab.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
