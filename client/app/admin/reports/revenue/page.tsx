"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusChip } from "@/components/status-chip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiPath } from "@/app/lib/api"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Loader2 } from "lucide-react"

interface RevenueByDoctor {
	name: string
	amount: number
}

interface RevenueByMonth {
	month: string
	amount: number
}

interface RevenueReport {
	totalRevenue: number
	revenueByDoctor: RevenueByDoctor[]
	revenueByMonth: RevenueByMonth[]
	appointments?: Array<{ patientName: string; doctorName: string; procedure_code?: string | null; amount?: number | null; start_at?: string | null }>
}

export default function RevenueReportPage() {
	const [data, setData] = useState<RevenueReport | null>(null)
	const [selectedDoctor, setSelectedDoctor] = useState<string>("all")
	const [startDate, setStartDate] = useState<string>("")
	const [endDate, setEndDate] = useState<string>("")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// derive doctor options and filtered data client-side
	const doctorOptions = (data?.appointments ?? []).reduce((acc: string[], a) => {
		if (a.doctorName && !acc.includes(a.doctorName)) acc.push(a.doctorName)
		return acc
	}, [])

	const filteredAppointments = (data?.appointments ?? []).filter((a) => {
		// doctor filter
		if (selectedDoctor !== "all" && a.doctorName !== selectedDoctor) return false

		// date filters (compare ISO date portion YYYY-MM-DD)
		if (startDate) {
			const aptDate = a.start_at ? a.start_at.slice(0, 10) : null
			if (!aptDate || aptDate < startDate) return false
		}
		if (endDate) {
			const aptDate = a.start_at ? a.start_at.slice(0, 10) : null
			if (!aptDate || aptDate > endDate) return false
		}

		return true
	})

	const displayTotalRevenue = filteredAppointments.reduce((sum, a) => sum + (a.amount ?? 0), 0)

	const displayRevenueByDoctor = (() => {
		const map: Record<string, number> = {}
		filteredAppointments.forEach((a) => {
			const name = a.doctorName || "Unassigned"
			map[name] = (map[name] || 0) + (a.amount ?? 0)
		})
		return Object.entries(map).map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }))
	})()

	const displayRevenueByMonth = (() => {
		const map: Record<string, number> = {}
		filteredAppointments.forEach((a) => {
			const ym = a.start_at ? new Date(a.start_at).toISOString().slice(0, 7) : "unknown"
			map[ym] = (map[ym] || 0) + (a.amount ?? 0)
		})
		return Object.entries(map).map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }))
	})()

	useEffect(() => {
		const fetchData = async () => {
			try {
				const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
				const res = await fetch(apiPath("/admin/reports/revenue"), {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				})
				if (!res.ok) throw new Error("Failed to fetch revenue report")
				const json = await res.json()
				setData(json as RevenueReport)
			} catch (err) {
				setError((err as Error).message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
	if (error) return <div className="text-destructive p-8">Error: {error}</div>
	if (!data) return null

	return (
		<div className="container mx-auto py-8 px-4 space-y-8">
			<div className="flex items-center gap-4">
				<label className="text-sm font-medium">Start</label>
				<input
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					className="border rounded px-2 py-1 text-sm"
				/>
				<label className="text-sm font-medium">End</label>
				<input
					type="date"
					value={endDate}
					onChange={(e) => setEndDate(e.target.value)}
					className="border rounded px-2 py-1 text-sm"
				/>
				<label className="text-sm font-medium">Filter by doctor</label>
				<Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
					<SelectTrigger>
						<SelectValue placeholder="All doctors" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All doctors</SelectItem>
						{doctorOptions.map((d) => (
							<SelectItem key={d} value={d}>{d}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<h1 className="text-3xl font-bold mb-2">Revenue Report</h1>
				<p className="text-muted-foreground">Summary of clinic revenue by provider and month.</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${displayTotalRevenue.toFixed(2)}</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Revenue by Doctor</CardTitle>
					</CardHeader>
					<CardContent className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={displayRevenueByDoctor}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
								<Bar dataKey="amount" fill="#8884d8" name="Revenue" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Revenue by Month</CardTitle>
					</CardHeader>
					<CardContent className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={displayRevenueByMonth}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
								<Bar dataKey="amount" fill="#00C49F" name="Revenue" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

				{/* Appointments list (same style as staff appointments) */}
				<div>
					<h2 className="text-xl font-semibold">Appointments considered</h2>
					<div className="space-y-4 mt-4">
						{filteredAppointments && filteredAppointments.length > 0 ? (
							filteredAppointments.map((apt, i) => {
								const start = apt.start_at ? new Date(apt.start_at) : null
								const dateLabel = start ? start.toLocaleDateString() : ""
								const timeLabel = start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ""
								return (
									<div key={i} className="p-4 hover:bg-muted/50 transition-colors bg-card rounded-xl border">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-2">
													<StatusChip status={"completed" as any} />
													<span className="text-sm text-muted-foreground">{dateLabel}</span>
												</div>

												<h3 className="font-semibold mb-1">{apt.patientName}</h3>

												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
													<div className="flex items-center gap-1.5">
														<span className="font-medium">Dr. {apt.doctorName}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<span>{apt.procedure_code ?? '—'}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<span>{apt.amount != null ? `$${Number(apt.amount).toFixed(2)}` : '—'}</span>
													</div>
												</div>
											</div>
											<div className="text-sm text-muted-foreground">{timeLabel}</div>
										</div>
									</div>
								)
							})
						) : (
							<div className="text-sm text-muted-foreground">No appointments found</div>
						)}
					</div>
				</div>
				</div>
	)
}
