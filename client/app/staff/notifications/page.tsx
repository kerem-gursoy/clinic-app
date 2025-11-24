"use client"

import { useEffect, useState } from "react"
import { apiPath } from "@/app/lib/api"
import { EmptyState } from "@/components/empty-state"
import { Bell } from "lucide-react"

interface NotificationRow {
  log_id: number
  patient_id?: number | null
  patient_name?: string | null
  column_name?: string | null
  new_value?: string | null
  changed_at?: string | null
  [key: string]: any
}

export default function StaffNotificationsPage() {
  const [logs, setLogs] = useState<NotificationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        const res = await fetch(apiPath("/staff/notifications"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body?.error || "Failed to load notifications")
        }
        if (cancelled) return
        setLogs(Array.isArray(body.logs) ? body.logs : [])
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError((err as Error).message || "Unable to load notifications")
          setLogs([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchLogs()
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading notifications…</div>
      </div>
    )
  }

  if (!isLoading && logs.length === 0) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="There are no patient update logs to display."
        />
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Notifications</h1>
        <p className="text-muted-foreground">Recent patient update logs</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive">
          Error: {error}
        </div>
      )}

      <div className="bg-card rounded-xl border divide-y">
        {logs.map((log) => {
          const changed = log.changed_at ? new Date(log.changed_at) : null
          const dateStr = changed
            ? changed.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
            : "Unknown time"

          const column = log.column_name ?? "field"
          const value = log.new_value ?? ""
          const patientDisplay = log.patient_name ? log.patient_name : `Patient #${log.patient_id ?? "N/A"}`

          return (
            <div key={log.log_id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground mb-1">
                    Updated {column} • {dateStr}
                  </div>
                  <h3 className="font-semibold mb-1">{patientDisplay}</h3>
                  {value ? (
                    <p className="text-sm text-muted-foreground">New value: {String(value)}</p>
                  ) : (
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-24">{JSON.stringify(log, null, 2)}</pre>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Showing {logs.length} {logs.length === 1 ? "notification" : "notifications"}
      </div>
    </div>
  )
}