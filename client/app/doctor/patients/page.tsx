"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Phone, Mail, Calendar, Plus, X, Filter } from "lucide-react"
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

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
        setPatients(data.patients.map(mapDoctorPatient))
        
        // Fetch medications and allergies for filters
        try {
          const [medsRes, allergiesRes] = await Promise.all([
            fetch(apiPath("/medications"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            }),
            fetch(apiPath("/allergies"), {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: "include",
            })
          ])
          
          if (medsRes.ok) {
            const medsData = await medsRes.json()
            setMedications(medsData.medications || [])
          }
          
          if (allergiesRes.ok) {
            const allergiesData = await allergiesRes.json()
            setAllergies(allergiesData.allergies || [])
          }
        } catch (filterErr) {
          console.warn("Failed to load filter data:", filterErr)
        }
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
    return () => {
      cancelled = true
    }
  }, [])

  const calculateAge = (dateOfBirth: string | null | undefined): number => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
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
        
        // Appointment date filter (simplified - would need appointment data)
        const matchesDateRange = true // TODO: Implement when appointment data is available
        
        // Medication filter
        const matchesMedications = filters.selectedMedications.length === 0 ||
          (patient.medications && filters.selectedMedications.some(med => 
            patient.medications?.includes(med)
          ))
        
        // Allergy filter
        const matchesAllergies = filters.selectedAllergies.length === 0 ||
          (patient.allergies && filters.selectedAllergies.some(allergy => 
            patient.allergies?.includes(allergy)
          ))
        
        return matchesSearch && matchesAge && matchesDateRange && matchesMedications && matchesAllergies
      }),
    [patients, searchQuery, filters],
  )

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
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
      </div>

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
            <PatientRow key={patient.id} patient={patient} onView={() => router.push(`/doctor/patients/${patient.patientId}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientRow({ patient, onView }: { patient: DoctorPatient; onView: () => void }) {
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
            <h3 className="font-semibold mb-1">{patient.name}</h3>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleString() : "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{patient.phone}</span>
              </div>
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
    email: patient.email ?? "N/A",
    phone: patient.phone ?? "N/A",
    lastVisit: patient.last_visit ?? null,
    dateOfBirth: patient.date_of_birth ?? null,
    medications: patient.medications ?? [],
    allergies: patient.allergies ?? [],
  }
}
