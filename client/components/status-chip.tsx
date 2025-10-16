import type { AppointmentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusChipProps {
  status: AppointmentStatus
  className?: string
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700",
  },
  "checked-in": {
    label: "Checked In",
    className: "bg-green-50 text-green-700",
  },
  "in-room": {
    label: "In Room",
    className: "bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-600",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700",
  },
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", config.className, className)}
    >
      {config.label}
    </span>
  )
}
