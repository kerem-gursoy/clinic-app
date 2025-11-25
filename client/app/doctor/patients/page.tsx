"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Phone, Mail, Calendar, Plus, X, Filter, BarChart3, Users, Activity, AlertTriangle } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { apiPath } from "@/app/lib/api"

interface DoctorPatientResponse {
  patient_id: number
  name: string
  email: string | null
  phone: string | null
  last_visit: string | null
  date_of_birth?: string | null
  medications?: string[]
  allergies?: string[]
}

interface DoctorPatient {
  id: string
  patientId: number
  name: string
  email: string
  phone: string
  lastVisit: string | null
  dateOfBirth?: string | null
  medications?: string[]
  allergies?: string[]
}

interface FilterOptions {
  startDate: string
  endDate: string
  minAge: string
  maxAge: string
  selectedMedications: string[]
  selectedAllergies: string[]
}

interface Medication {
  id: number
  name: string
}

interface Allergy {
  id: number
  name: string
}

interface Appointment {
  appointment_id: number
  patient_id: number
  patientName: string
  reason: string | null
  status: string | null
  start_at: string | null
  time: string
  duration: string
  notes: string | null
}

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: "",
    endDate: "",
    minAge: "",
    maxAge: "",
    selectedMedications: [],
    selectedAllergies: []
  })

  // Function to fetch appointments
  const fetchAppointments = async () => {
    try {
      setIsLoadingAppointments(true)
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      
      const res = await fetch(apiPath("/doctor/appointments"), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      })
      
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !Array.isArray(data.appointments)) {
        throw new Error("Failed to load appointments")
      }
      
      setAppointments(data.appointments)
    } catch (err) {
      console.error("Failed to fetch appointments:", err)
      setAppointments([])
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchPatients = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        
        // Fetch patients
        const res = await fetch(apiPath("/doctor/patients"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !Array.isArray(data.patients)) {
          throw new Error("Failed to load patients")
        }
        if (cancelled) return
        
        // Extract unique medications and allergies from patient data
        const patientMedications = new Set<string>()
        const patientAllergies = new Set<string>()
        
        const mappedPatients = data.patients.map(mapDoctorPatient)
        setPatients(mappedPatients)
        
        // Now extract medications and allergies from the mapped patients
        mappedPatients.forEach((patient: DoctorPatient) => {
          if (patient.medications) {
            patient.medications.forEach(med => {
              if (med && med.trim()) {
                patientMedications.add(med.trim())
              }
            })
          }
          if (patient.allergies) {
            patient.allergies.forEach(allergy => {
              if (allergy && allergy.trim()) {
                patientAllergies.add(allergy.trim())
              }
            })
          }
        })
        
        // Convert to array format expected by the UI
        setMedications(Array.from(patientMedications).sort().map((med, index) => ({ id: index, name: med })))
        setAllergies(Array.from(patientAllergies).sort().map((allergy, index) => ({ id: index, name: allergy })))
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setPatients([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPatients()
    fetchAppointments()
    return () => {
      cancelled = true
    }
  }, [])

  const calculateAge = (dateOfBirth: string | null | undefined): number => {
    if (!dateOfBirth) return 0
    
    try {
      const today = new Date()
      // Handle different date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
      const birth = new Date(dateOfBirth)
      
      // Check if the date is valid
      if (isNaN(birth.getTime())) {
        console.warn('Invalid date format:', dateOfBirth)
        return 0
      }
      
      // Calculate age
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      // Adjust age if birthday hasn't occurred this year yet
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      // Ensure age is not negative
      return Math.max(0, age)
    } catch (error) {
      console.warn('Error calculating age for date:', dateOfBirth, error)
      return 0
    }
  }

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        // Text search filter
        const matchesSearch = searchQuery === "" ||
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery)
        
        // Age filter
        const age = calculateAge(patient.dateOfBirth)
        const matchesAge = (filters.minAge === "" || age >= parseInt(filters.minAge)) &&
                          (filters.maxAge === "" || age <= parseInt(filters.maxAge))
        
        // Appointment date filter
        const matchesDateRange = (() => {
          if (!filters.startDate && !filters.endDate) return true
          if (!patient.lastVisit) return false
          
          const lastVisitDate = new Date(patient.lastVisit)
          const startDate = filters.startDate ? new Date(filters.startDate) : null
          const endDate = filters.endDate ? new Date(filters.endDate) : null
          
          if (startDate && lastVisitDate < startDate) return false
          if (endDate && lastVisitDate > endDate) return false
          
          return true
        })()
        
        // Medication filter
        const matchesMedications = filters.selectedMedications.length === 0 ||
          (patient.medications && Array.isArray(patient.medications) && patient.medications.length > 0 && 
           filters.selectedMedications.some(selectedMed => 
             patient.medications!.some(patientMed => patientMed?.trim() === selectedMed?.trim())
           ))
        
        // Allergy filter
        const matchesAllergies = filters.selectedAllergies.length === 0 ||
          (patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0 && 
           filters.selectedAllergies.some(selectedAllergy => 
             patient.allergies!.some(patientAllergy => patientAllergy?.trim() === selectedAllergy?.trim())
           ))
        
        return matchesSearch && matchesAge && matchesDateRange && matchesMedications && matchesAllergies
      }),
    [patients, searchQuery, filters],
  )

  // Histogram data computation
  const histogramData = useMemo(() => {
    if (!filters.startDate && !filters.endDate) return []
    
    const filteredAppointments = appointments.filter(appointment => {
      if (!appointment.start_at) return false
      
      const appointmentDate = new Date(appointment.start_at)
      const startDate = filters.startDate ? new Date(filters.startDate) : null
      const endDate = filters.endDate ? new Date(filters.endDate) : null
      
      if (startDate && appointmentDate < startDate) return false
      if (endDate && appointmentDate > endDate) return false
      
      return true
    })
    
    // Group appointments by date
    const dateGroups = new Map<string, number>()
    
    filteredAppointments.forEach(appointment => {
      if (appointment.start_at) {
        const date = new Date(appointment.start_at).toISOString().split('T')[0]
        dateGroups.set(date, (dateGroups.get(date) || 0) + 1)
      }
    })
    
    // Convert to chart data format
    return Array.from(dateGroups.entries())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        patients: count
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [appointments, filters.startDate, filters.endDate])

  // Pie chart data for medications
  const medicationPieData = useMemo(() => {
    const medicationCounts = new Map<string, number>()
    
    filteredPatients.forEach(patient => {
      if (patient.medications) {
        patient.medications.forEach(med => {
          if (med && med.trim()) {
            const medication = med.trim()
            medicationCounts.set(medication, (medicationCounts.get(medication) || 0) + 1)
          }
        })
      }
    })
    
    return Array.from(medicationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name: name.length > 10 ? `${name.substring(0, 10)}...` : name,
        fullName: name,
        value: count,
        fill: `hsl(${(index * 137) % 360}, 70%, 50%)`
      }))
  }, [filteredPatients])

  // Statistics computation
  const statistics = useMemo(() => {
    const stats = {
      totalPatients: filteredPatients.length,
      appointmentPeriod: 0,
      ageRanges: {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0
      },
      topMedications: new Map<string, number>(),
      topAllergies: new Map<string, number>()
    }

    // Calculate age ranges and collect medications/allergies
    filteredPatients.forEach(patient => {
      const age = calculateAge(patient.dateOfBirth)
      
      // Age range categorization
      if (age <= 18) stats.ageRanges['0-18']++
      else if (age <= 35) stats.ageRanges['19-35']++
      else if (age <= 50) stats.ageRanges['36-50']++
      else if (age <= 65) stats.ageRanges['51-65']++
      else stats.ageRanges['65+']++

      // Count medications
      if (patient.medications) {
        patient.medications.forEach(med => {
          stats.topMedications.set(med, (stats.topMedications.get(med) || 0) + 1)
        })
      }

      // Count allergies
      if (patient.allergies) {
        patient.allergies.forEach(allergy => {
          stats.topAllergies.set(allergy, (stats.topAllergies.get(allergy) || 0) + 1)
        })
      }
    })

    // Calculate patients with appointments in the specified period
    if (filters.startDate || filters.endDate) {
      stats.appointmentPeriod = filteredPatients.filter(patient => {
        if (!patient.lastVisit) return false
        
        const lastVisitDate = new Date(patient.lastVisit)
        const startDate = filters.startDate ? new Date(filters.startDate) : null
        const endDate = filters.endDate ? new Date(filters.endDate) : null
        
        if (startDate && lastVisitDate < startDate) return false
        if (endDate && lastVisitDate > endDate) return false
        
        return true
      }).length
    }

    return {
      ...stats,
      topMedications: Array.from(stats.topMedications.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topAllergies: Array.from(stats.topAllergies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }
  }, [filteredPatients, filters, calculateAge])

  // Check if any query or filter is applied
  const hasActiveQuery = useMemo(() => {
    return searchQuery.length > 0 || 
           filters.selectedMedications.length > 0 || 
           filters.selectedAllergies.length > 0 || 
           filters.minAge !== "" || 
           filters.maxAge !== "" || 
           filters.startDate !== "" || 
           filters.endDate !== ""
  }, [searchQuery, filters])

  // Chart configuration
  const chartConfig = {
    patients: {
      label: "Patients",
      color: "hsl(220, 70%, 50%)",
    },
    medications: {
      label: "Medications",
      color: "hsl(160, 70%, 50%)",
    },
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">My Patients</h1>
        <p className="text-muted-foreground">Search and manage your patient list</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        
        {/* Clear Filters Button */}
        {(filters.selectedMedications.length > 0 || filters.selectedAllergies.length > 0 || 
          filters.minAge || filters.maxAge || filters.startDate || filters.endDate) && (
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                startDate: "",
                endDate: "",
                minAge: "",
                maxAge: "",
                selectedMedications: [],
                selectedAllergies: []
              })}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
        
        {/* Active Filters Display */}
        {(filters.selectedMedications.length > 0 || filters.selectedAllergies.length > 0 || 
          filters.minAge || filters.maxAge || filters.startDate || filters.endDate) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.selectedMedications.map((med) => (
              <Badge key={med} variant="secondary" className="flex items-center gap-1">
                Medication: {med}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    selectedMedications: prev.selectedMedications.filter(m => m !== med)
                  }))}
                />
              </Badge>
            ))}
            {filters.selectedAllergies.map((allergy) => (
              <Badge key={allergy} variant="secondary" className="flex items-center gap-1">
                Allergy: {allergy}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    selectedAllergies: prev.selectedAllergies.filter(a => a !== allergy)
                  }))}
                />
              </Badge>
            ))}
            {(filters.minAge || filters.maxAge) && (
              <Badge variant="secondary">
                Age: {filters.minAge || '0'}-{filters.maxAge || '∞'}
              </Badge>
            )}
            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary">
                Appointments: {filters.startDate || 'any'} to {filters.endDate || 'any'}
              </Badge>
            )}
          </div>
        )}
      </div>
        
      {/* Filter Panel */}
        <Card className="mb-4">
          <CardContent className="px-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-medium">Filter by:</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Appointment Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment Period</label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Age Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Range</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min Age"
                    value={filters.minAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max Age"
                    value={filters.maxAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Medications */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Medications</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value && !filters.selectedMedications.includes(e.target.value)) {
                      setFilters(prev => ({
                        ...prev,
                        selectedMedications: [...prev.selectedMedications, e.target.value]
                      }))
                    }
                    e.target.value = ""
                  }}
                >
                  <option value="">Select medication...</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.name}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value && !filters.selectedAllergies.includes(e.target.value)) {
                      setFilters(prev => ({
                        ...prev,
                        selectedAllergies: [...prev.selectedAllergies, e.target.value]
                      }))
                    }
                    e.target.value = ""
                  }}
                >
                  <option value="">Select allergy...</option>
                  {allergies.map((allergy) => (
                    <option key={allergy.id} value={allergy.name}>
                      {allergy.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Panel - Only show when there's an active query */}
        {hasActiveQuery && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-4 px-6 pt-6">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-medium">Patient Statistics</h3>
            </div>
            <CardContent className="px-6 pb-6 max-h-[32rem] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Patients */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <label className="text-sm font-medium">Total Patients</label>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.totalPatients}
                </div>
              </div>

              {/* Appointment Period */}
              {(filters.startDate || filters.endDate) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <label className="text-sm font-medium">In Date Range</label>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.appointmentPeriod}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {filters.startDate && filters.endDate 
                      ? `${filters.startDate} to ${filters.endDate}`
                      : filters.startDate 
                        ? `From ${filters.startDate}`
                        : `Until ${filters.endDate}`
                    }
                  </div>
                </div>
              )}

              {/* Age Ranges */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <label className="text-sm font-medium">Age Distribution</label>
                </div>
                <div className="space-y-1 text-sm">
                  {Object.entries(statistics.ageRanges).map(([range, count]) => (
                    <div key={range} className="flex justify-between">
                      <span className="text-muted-foreground">{range}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Medications & Allergies */}
              <div className="space-y-3">
                {/* Top Medications */}
                {statistics.topMedications.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <label className="text-sm font-medium">Top Medications</label>
                    </div>
                    <div className="space-y-1 text-sm">
                      {statistics.topMedications.slice(0, 3).map(([med, count]) => (
                        <div key={med} className="flex justify-between">
                          <span className="text-muted-foreground truncate" title={med}>
                            {med.length > 15 ? `${med.substring(0, 15)}...` : med}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Allergies */}
                {statistics.topAllergies.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <label className="text-sm font-medium">Top Allergies</label>
                    </div>
                    <div className="space-y-1 text-sm">
                      {statistics.topAllergies.slice(0, 3).map(([allergy, count]) => (
                        <div key={allergy} className="flex justify-between">
                          <span className="text-muted-foreground truncate" title={allergy}>
                            {allergy.length > 15 ? `${allergy.substring(0, 15)}...` : allergy}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Histogram Chart - Appointments by Date */}
            {histogramData.length > 0 && (
              <div className="mt-4 col-span-full border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-sm font-medium">Appointments by Date</h4>
                </div>
                <div className="flex gap-4">
                  {/* Bar Chart - Appointments by Date */}
                  <div className="h-40 w-1/2 bg-muted/20 rounded-md p-2">
                    <ChartContainer config={chartConfig}>
                      <BarChart data={histogramData} margin={{ top: 2, right: 5, left: 15, bottom: 12 }}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 6 }}
                          angle={-90}
                          textAnchor="end"
                          height={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fontSize: 6 }}
                          width={15}
                          domain={[0, 'dataMax + 1']}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(value, payload) => {
                            const data = payload?.[0]?.payload
                            return data?.fullDate ? new Date(data.fullDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : value
                          }}
                        />
                        <Bar 
                          dataKey="patients" 
                          fill="var(--color-patients)" 
                          radius={[0, 0, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                  
                  {/* Pie Chart - Medication Distribution */}
                  {medicationPieData.length > 0 && (
                    <div className="h-40 w-1/2 bg-muted/20 rounded-md p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-xs font-medium">Top Medications</span>
                      </div>
                      <ChartContainer config={chartConfig}>
                        <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <Pie
                            data={medicationPieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {medicationPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-background border rounded p-2 shadow">
                                    <p className="font-medium">{data.fullName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {data.value} patient{data.value !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ChartContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

      {/* Results */}
      {isLoading ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">Loading patients…</div>
      ) : searchQuery && filteredPatients.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No patients found"
          description="Try adjusting your search terms or browse all patients."
        />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={User}
          title="No patients yet"
          description="Your patient list will appear here once you start seeing patients."
        />
      ) : (
        <div className="bg-card rounded-xl border divide-y">
          {filteredPatients.map((patient) => (
            <PatientRow key={patient.id} patient={patient} calculateAge={calculateAge} onView={() => router.push(`/doctor/patients/${patient.patientId}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientRow({ patient, calculateAge, onView }: { patient: DoctorPatient; calculateAge: (dateOfBirth: string | null | undefined) => number; onView: () => void }) {
  const age = calculateAge(patient.dateOfBirth)
  
  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{patient.name}</h3>
              {patient.dateOfBirth && (
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Age: {age}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {patient.lastVisit && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last visit: {new Date(patient.lastVisit).toLocaleString()}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{patient.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-transparent" onClick={onView}>
            View
          </Button>          
        </div>
      </div>
    </div>
  )
}

function mapDoctorPatient(patient: DoctorPatientResponse): DoctorPatient {
  return {
    id: `doctor-patient-${patient.patient_id}`,
    patientId: patient.patient_id,
    name: patient.name,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    lastVisit: patient.last_visit ?? null,
    dateOfBirth: patient.date_of_birth ?? null,
    medications: patient.medications ?? [],
    allergies: patient.allergies ?? [],
  }
}