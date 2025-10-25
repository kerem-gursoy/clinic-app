"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  User, 
  Menu, 
  X, 
  Home,
  Calendar,
  FileText,
  MoreHorizontal,
  ClipboardList,
  Users,
  Stethoscope,
  Building,
  Settings,
  LogOut,
  Heart
} from "lucide-react"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TopBarProps {
  role: UserRole
  onRoleChange: (role: UserRole) => void
  onNewAppointment: () => void
  onLogout: () => Promise<void> | void
}

const roleConfig = {
  patient: {
    label: "Patient",
    tabs: [
      { label: "Home", href: "/patient", icon: Home },
      { label: "Appointments", href: "/patient/appointments", icon: Calendar },
      { label: "My Health", href: "/patient/my-health", icon: Heart },
      { label: "Other", href: "/patient/other", icon: MoreHorizontal },
    ],
  },
  doctor: {
    label: "Doctor",
    tabs: [
      { label: "Home", href: "/doctor", icon: Home },
      { label: "Calendar", href: "/doctor/appointments", icon: Calendar },
      { label: "Patients", href: "/doctor/patients", icon: Users },
      { label: "Other", href: "/doctor/other", icon: MoreHorizontal },
    ],
  },
  staff: {
    label: "Staff",
    tabs: [
      { label: "Home", href: "/staff", icon: Home },
      { label: "Agenda", href: "/staff/appointments", icon: ClipboardList },
      { label: "Patients", href: "/staff/patients", icon: Users },
      { label: "Doctors", href: "/staff/doctors", icon: Stethoscope },
      { label: "Other", href: "/staff/other", icon: MoreHorizontal },
    ],
  },
}

export function TopBar({ role, onRoleChange, onNewAppointment, onLogout }: TopBarProps) {
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
  <header className="sticky top-0 z-[100] w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="flex h-14 items-center px-3 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-base">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            A
          </div>
          <span className="hidden sm:inline truncate">Appointments</span>
        </div>

        {/* Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex bg-transparent">
              {config.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRoleChange("patient")}>Patient</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange("doctor")}>Doctor</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange("staff")}>Staff</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto px-1 scrollbar-none">
          {config.tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link key={tab.href} href={tab.href}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "rounded-full gap-1.5 h-8 px-2.5 whitespace-nowrap",
                    pathname === tab.href && "bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-[280px] min-w-[200px]">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search... (⌘K)" className="pl-8 rounded-full h-8" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
          <Button size="sm" onClick={onNewAppointment} className="rounded-full h-8 px-2.5">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">New</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-3.5 w-3.5 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-3.5 w-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="h-3.5 w-3.5 mr-2" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden rounded-full h-8 w-8 p-0" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
          <nav className="flex flex-col p-2">
            {config.tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-1.5 h-9",
                      pathname === tab.href && "bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
