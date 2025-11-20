"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Plus, User, Menu, X } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getStoredAuthUser, type AuthUser } from "@/lib/auth"

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
    ],
  },
}

export function TopBar({ role, userName, onNewAppointment, onLogout }: TopBarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const config = roleConfig[role]

  useEffect(() => {
    const storedUser = getStoredAuthUser()
    if (storedUser) {
      setAuthUser(storedUser)
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await onLogout()
    } finally {
      setIsLoggingOut(false)
      setIsProfileDialogOpen(false)
    }
  }

  const nameParts = [authUser?.first_name, authUser?.last_name].filter((part): part is string => Boolean(part))
  const profileName = nameParts.join(" ").trim()
  const displayName = profileName || userName
  const email = authUser?.email ?? "Email unavailable"
  const userId = authUser?.user_id ? `#${authUser.user_id}` : "Unknown ID"
  const roleLabel = config.label

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="font-semibold text-lg">
          Welcome, {userName}
        </div>
        
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {config.tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <Button variant="ghost" size="sm" className={cn("rounded-full", pathname === tab.href && "bg-muted")}>
                {tab.label}
              </Button>
            </Link>
          ))}
        </nav>


        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open profile">
                <User className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
                <DialogDescription>Review your account information</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel}</p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-right">{email}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-medium text-right">{userId}</dd>
                </div>
              </dl>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

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
