"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Activity, FileText, Clipboard } from "lucide-react"
import { mockAppointments, mockVitals } from "@/lib/mock-data"
import { ChartContainer } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts"
import { useSearchParams, useRouter } from "next/navigation"

type TabKey = "summary" | "vitals" | "records" | "forms"

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "summary", label: "Health Summary", icon: Activity },
  { key: "vitals", label: "Vitals", icon: Heart },
  { key: "records", label: "Health Records", icon: FileText },
  { key: "forms", label: "Forms & Documents", icon: Clipboard },
]

export default function MyHealthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTab = (searchParams.get("tab") as TabKey) || ("summary" as TabKey)
  const initialMetric = (searchParams.get("metric") as string) || "weight"

  const [active, setActive] = useState<TabKey>(initialTab)
  const [metric, setMetric] = useState<string>(initialMetric)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // update URL when active tab changes
    const url = new URL(window.location.href)
    url.searchParams.set("tab", active)
    if (metric) url.searchParams.set("metric", metric)
    router.replace(url.toString())
    // trigger simple fade
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [active, metric, router])

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Health</h1>
          <p className="text-muted-foreground">Access your health summary, vitals, records, and forms.</p>
        </div>
        <div className="flex gap-3">
          <Button className="w-full sm:w-auto" onClick={() => (window.location.href = "/patient")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Horizontal tab buttons */}
      <div className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md transition-colors ${
                  isActive ? "font-semibold text-primary underline decoration-2 decoration-primary" : "text-muted-foreground hover:underline"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

  {/* Content area switches based on active tab */}
  <div className={`bg-card rounded-md border p-6 transition-opacity duration-250 ${visible ? "opacity-100" : "opacity-0"}`}>
        {active === "summary" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Health Summary</h2>
            <p className="text-sm text-muted-foreground mb-4">A quick overview of your health status, recent visits, and care gaps.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/5 rounded">Latest Diagnosis: Hypertension</div>
              <div className="p-4 bg-muted/5 rounded">Active Medications: 2</div>
            </div>
          </section>
        )}

        {active === "vitals" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Vitals</h2>

            {/* Metric selector buttons */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                { key: "weight", label: "Weight" },
                { key: "blood_pressure", label: "Blood Pressure" },
                { key: "bmi", label: "BMI" },
                { key: "hr", label: "Heart Rate" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    metric === m.key ? "underline decoration-2 font-semibold text-primary" : "text-muted-foreground hover:underline"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Build vitals data from mockVitals for demo */}
            {(() => {
              const visits = mockVitals
                .filter((v) => v.patientId === "p1")
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

              const data = visits.map((v) => ({
                date: new Date(v.date).toLocaleDateString("en-US"),
                weight: v.weight,
                hr: v.hr,
                systolic: v.systolic,
                diastolic: v.diastolic,
                bmi: v.bmi,
              }))

              const config = {
                weight: { label: "Weight (lbs)", color: "var(--color-chart-1)" },
                hr: { label: "Heart Rate (bpm)", color: "var(--color-chart-2)" },
                systolic: { label: "Systolic", color: "var(--color-chart-3)" },
                diastolic: { label: "Diastolic", color: "var(--color-chart-4)" },
                bmi: { label: "BMI", color: "var(--color-chart-5)" },
              }

              return (
                <div className="grid grid-cols-1">
                  {metric === "weight" && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Weight</h3>
                      <ChartContainer config={config} className="h-64">
                        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[20, 32]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}

                  {metric === "hr" && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Heart Rate</h3>
                      <ChartContainer config={config} className="h-64">
                        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="hr" stroke="var(--color-chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}

                  {metric === "blood_pressure" && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Blood Pressure</h3>
                      <ChartContainer config={config} className="h-64">
                        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="systolic" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="diastolic" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}

                  {metric === "bmi" && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">BMI</h3>
                      <ChartContainer config={config} className="h-64">
                        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                          {/* shaded BMI ranges: underweight (<18.5) yellow, normal (18.5-24.9) green, overweight (25-29.9) yellow, obese (>30) red */}
                          <ReferenceArea y1={0} y2={18.5} fill="#fff4cc" fillOpacity={0.7} />
                          <ReferenceArea y1={18.5} y2={24.9} fill="#e6ffed" fillOpacity={0.7} />
                          <ReferenceArea y1={25} y2={29.9} fill="#fff4cc" fillOpacity={0.7} />
                          <ReferenceArea y1={30} y2={100} fill="#ffd6d6" fillOpacity={0.7} />
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="bmi" stroke="var(--color-chart-5)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}
                </div>
              )
            })()}
          </section>
        )}

        {active === "records" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Health Records</h2>
            <p className="text-sm text-muted-foreground mb-4">Recent visits and notes.</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>2025-09-01 — Annual check-up — Dr. Smith</li>
              <li>2024-12-15 — Flu shot — Clinic</li>
            </ol>
          </section>
        )}

        {active === "forms" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Forms & Documents</h2>
            <p className="text-sm text-muted-foreground mb-4">Upload or download intake forms and consents.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => window.location.href = "/patient/my-health/forms"}>
                View Forms
              </Button>
              <Button onClick={() => alert("Upload not implemented in demo")}>Upload Document</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
