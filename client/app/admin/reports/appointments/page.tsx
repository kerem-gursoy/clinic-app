"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPath } from "@/app/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

interface ReportData {
  totalAppointments: number;
  appointmentsByDoctor: { name: string; count: number }[];
  statusDistribution: { name: string; value: number }[];
  genderByDoctor: { doctor: string; Male: number; Female: number; Other: number }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AppointmentReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(apiPath("/api/admin/reports/appointments"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to fetch report data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (error) return <div className="text-destructive p-8">Error: {error}</div>;
  if (!data) return null;

  const completionRate = data.totalAppointments > 0
    ? ((data.statusDistribution.find(s => s.name === 'completed')?.value || 0) / data.totalAppointments * 100).toFixed(1)
    : "0";

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Appointment Demographics & Efficiency</h1>
        <p className="text-muted-foreground">Comprehensive analysis of clinic appointments, provider workload, and patient demographics.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Appointments by Doctor</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.appointmentsByDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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
          <CardContent className="h-[300px]">
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
      <Card>
        <CardHeader>
          <CardTitle>Patient Gender Distribution per Doctor</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.genderByDoctor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="doctor" />
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
    </div>
  );
}
