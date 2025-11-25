"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPath } from "@/app/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReportTotals {
  totalAppointments: number;
  completionRate: number;
  cancelRate: number;
  noShowRate: number;
  averageLeadTimeDays: number;
}

interface ReportData {
  range: { start: string; end: string };
  previousRange: { start: string; end: string };
  totals: ReportTotals;
  previousTotals: ReportTotals;
  deltas: ReportTotals;
  appointmentsByDoctor: { name: string; count: number }[];
  statusDistribution: { name: string; value: number }[];
  genderByDoctor: { doctor: string; Male: number; Female: number; Other: number }[];
  providerLoad: { doctor: string; loadPerHour: number; appointments: number; totalMinutes: number }[];
  heavyDays: { doctor: string; date: string; loadPerHour: number; appointments: number; totalMinutes: number }[];
  filtersApplied: {
    dateFrom: string;
    dateTo: string;
    providerId: number | null;
    status: string | null;
    capacityThreshold: number;
  };
}

interface DoctorOption {
  doctor_id: number;
  name?: string;
  doc_fname?: string;
  doc_lname?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No Show" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

type FiltersState = {
  dateFrom: string;
  dateTo: string;
  providerId: string;
  status: string;
  capacityThreshold: number;
};

export default function AppointmentReportPage() {
  const defaultEnd = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const [filters, setFilters] = useState<FiltersState>({
    dateFrom: formatInputDate(defaultStart),
    dateTo: formatInputDate(defaultEnd),
    providerId: "all",
    status: "all",
    capacityThreshold: 4,
  });

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(apiPath("/staff/doctors"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body.doctors)) {
          setDoctors(body.doctors);
        }
      } catch (err) {
        console.error("Failed to load doctors list", err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsApplying(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.providerId && filters.providerId !== "all") params.set("providerId", filters.providerId);
        if (filters.status && filters.status !== "all") params.set("status", filters.status);
        if (filters.capacityThreshold) params.set("capacityThreshold", String(filters.capacityThreshold));

        const res = await fetch(apiPath(`/staff/reports/appointments?${params.toString()}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch report data");
        const json = await res.json();
        setData(normalizeReportResponse(json, filters));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setIsApplying(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }
  if (error) return <div className="text-destructive p-8">Error: {error}</div>;
  if (!data) return null;

  const kpiCards = [
    {
      label: "Total Appointments",
      value: data.totals.totalAppointments,
      delta: data.deltas.totalAppointments,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Completion Rate",
      value: data.totals.completionRate,
      delta: data.deltas.completionRate,
      suffix: "%",
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Cancel Rate",
      value: data.totals.cancelRate,
      delta: data.deltas.cancelRate,
      suffix: "%",
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "No-Show Rate",
      value: data.totals.noShowRate,
      delta: data.deltas.noShowRate,
      suffix: "%",
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Avg Lead Time",
      value: data.totals.averageLeadTimeDays,
      delta: data.deltas.averageLeadTimeDays,
      suffix: " days",
      format: (v: number) => v.toFixed(1),
    },
  ];

  const providerLoadChart = data.providerLoad.map((entry) => ({
    doctor: entry.doctor,
    loadPerHour: Number(entry.loadPerHour?.toFixed(2)),
    appointments: entry.appointments,
  }));

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Appointment Insights</h1>
        <p className="text-muted-foreground">
          Insight on doctors and appointments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Provider</label>
            <Select
              value={filters.providerId}
              onValueChange={(val) => setFilters((prev) => ({ ...prev, providerId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {doctors.map((doc) => {
                  const label = doc.name || buildDoctorName(doc.doc_fname, doc.doc_lname);
                  return (
                    <SelectItem key={doc.doctor_id} value={String(doc.doctor_id)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select
              value={filters.status}
              onValueChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Capacity threshold (appointments/hr)</label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={filters.capacityThreshold}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, capacityThreshold: Number(e.target.value) || 1 }))
              }
            />
          </div>
        </CardContent>
        <div className="px-6 pb-4">
          <Button disabled={isApplying} onClick={() => setFilters((prev) => ({ ...prev }))}>
            {isApplying ? "Applying..." : "Apply Filters"}
          </Button>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <Delta value={kpi.delta} suffix={kpi.suffix} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.format(kpi.value)}
                {kpi.suffix ?? ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Appointments by Doctor</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.appointmentsByDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={false} tickLine={false} axisLine={false} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Gender Distribution per Doctor</CardTitle>
          </CardHeader>
          <CardContent className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.genderByDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctor" tick={false} tickLine={false} axisLine={false} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Female" stackId="a" fill="#FF8042" />
                <Bar dataKey="Male" stackId="a" fill="#0088FE" />
                <Bar dataKey="Other" stackId="a" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Load vs Capacity (avg appointments/hour)</CardTitle>
          </CardHeader>
          <CardContent className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerLoadChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctor" tick={false} tickLine={false} axisLine={false} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="loadPerHour" fill="#00C49F" name="Avg per hour" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Staffing signals */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Heavy Days</CardTitle>
          <p className="text-sm text-muted-foreground">
            Days where appointments/hour exceed the configured capacity threshold.
          </p>
        </CardHeader>
        <CardContent>
          {data.heavyDays.length === 0 ? (
            <p className="text-muted-foreground text-sm">No heavy days in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-4">Doctor</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Appointments</th>
                    <th className="text-left py-2 pr-4">Load / hr</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heavyDays.map((day) => (
                    <tr key={`${day.doctor}-${day.date}`} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{day.doctor}</td>
                      <td className="py-2 pr-4">{day.date}</td>
                      <td className="py-2 pr-4">{day.appointments}</td>
                      <td className="py-2 pr-4">{day.loadPerHour.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildDoctorName(first?: string, last?: string) {
  return [first, last].filter(Boolean).join(" ").trim() || "Unassigned";
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeReportResponse(serverData: any, filters: FiltersState): ReportData {
  const statusDistribution = Array.isArray(serverData?.statusDistribution)
    ? serverData.statusDistribution
    : [];
  const appointmentsByDoctor = Array.isArray(serverData?.appointmentsByDoctor)
    ? serverData.appointmentsByDoctor
    : [];
  const genderByDoctor = Array.isArray(serverData?.genderByDoctor) ? serverData.genderByDoctor : [];
  const totals =
    serverData?.totals ??
    buildTotalsFromLegacyData(serverData, statusDistribution, appointmentsByDoctor);
  const previousTotals = serverData?.previousTotals ?? totals;
  const deltas = serverData?.deltas ?? createEmptyTotals();
  const providerLoad = Array.isArray(serverData?.providerLoad)
    ? serverData.providerLoad
    : buildProviderLoadFallback(appointmentsByDoctor);
  const heavyDays = Array.isArray(serverData?.heavyDays) ? serverData.heavyDays : [];
  const range = serverData?.range ?? { start: filters.dateFrom, end: filters.dateTo };
  const previousRange = serverData?.previousRange ?? range;
  const filtersApplied =
    serverData?.filtersApplied ??
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      providerId: filters.providerId === "all" ? null : Number(filters.providerId),
      status: filters.status === "all" ? null : filters.status,
      capacityThreshold: filters.capacityThreshold,
    };

  return {
    range,
    previousRange,
    totals,
    previousTotals,
    deltas,
    appointmentsByDoctor,
    statusDistribution,
    genderByDoctor,
    providerLoad,
    heavyDays,
    filtersApplied,
  };
}

function createEmptyTotals(): ReportTotals {
  return {
    totalAppointments: 0,
    completionRate: 0,
    cancelRate: 0,
    noShowRate: 0,
    averageLeadTimeDays: 0,
  };
}

function buildTotalsFromLegacyData(
  serverData: any,
  statusDistribution: { name: string; value: number }[],
  appointmentsByDoctor: { name: string; count: number }[]
): ReportTotals {
  const totals = createEmptyTotals();
  const totalFromStatus = statusDistribution.reduce(
    (sum, entry) => sum + (typeof entry.value === "number" ? entry.value : 0),
    0
  );
  const totalFromDoctor = appointmentsByDoctor.reduce(
    (sum, entry) => sum + (typeof entry.count === "number" ? entry.count : 0),
    0
  );
  totals.totalAppointments =
    typeof serverData?.totalAppointments === "number"
      ? serverData.totalAppointments
      : Math.max(totalFromStatus, totalFromDoctor);

  const total = totals.totalAppointments || 0;
  const getRate = (status: string) => {
    if (!total) return 0;
    const entry = statusDistribution.find(
      (s) => String(s.name).toLowerCase() === status.toLowerCase()
    );
    const value = entry && typeof entry.value === "number" ? entry.value : 0;
    return (value / total) * 100;
  };
  totals.completionRate = getRate("completed");
  totals.cancelRate = getRate("canceled");

  totals.noShowRate = Math.max(
    getRate("no_show"),
    getRate("no-show"),
    getRate("no show"),
    getRate("noshow")
  );

  totals.averageLeadTimeDays =
    typeof serverData?.averageLeadTimeDays === "number" ? serverData.averageLeadTimeDays : 0;

  return totals;
}

function buildProviderLoadFallback(
  appointmentsByDoctor: { name: string; count: number }[]
): { doctor: string; loadPerHour: number; appointments: number; totalMinutes: number }[] {
  return appointmentsByDoctor.map((entry) => ({
    doctor: entry.name,
    loadPerHour: 0,
    appointments: typeof entry.count === "number" ? entry.count : 0,
    totalMinutes: (typeof entry.count === "number" ? entry.count : 0) * 30,
  }));
}

function Delta({ value, suffix }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">no change</span>;
  const isUp = value > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-4 w-4" />
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
      {suffix ?? ""}
    </span>
  );
}
