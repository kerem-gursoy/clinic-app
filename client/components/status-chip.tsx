import type { AppointmentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusChipProps {
  status: AppointmentStatus
  className?: string
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700",
  },
  checked_in: {
    label: "Checked In",
    className: "bg-green-50 text-green-700",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-600",
  },
  canceled: {
    label: "Canceled",
    className: "bg-red-50 text-red-700",
  },
  no_show: {
    label: "No-show",
    className: "bg-red-100 text-red-800",
  },
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status] ?? statusConfig.scheduled

  return (
    <span
      className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", config.className, className)}
    >
      {config.label}
    </span>
  )
}
