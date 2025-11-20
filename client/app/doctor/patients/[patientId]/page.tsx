"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  FileText,
  Clock,
  Plus,
  Stethoscope,
  PillBottle,
  AlertTriangle,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { apiPath } from "@/app/lib/api"

interface PatientDetail {
  patient_id: number
  name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact: string | null
  medical_history: string | null
  created_at: string
  last_visit: string | null
}

interface Appointment {
  appointment_id: number
  start_at: string
  end_at: string
  status: string
  reason: string | null
}

interface Medication {
  medication_id: number
  medication_name: string
  dosage: string | null
  frequency: string | null
  start_date: string | null
  end_date: string | null
  prescribed_by: number | null
  status: string | null
}

interface Allergy {
  allergy_id: number
  allergy_name: string
  severity: string | null
  reaction: string | null
  notes: string | null
}

interface MedicalHistoryRecord {
  history_id: number
  condition: string
  diagnosis_date: string | null
  treatment: string | null
  notes: string | null
  doctor_id: number | null
  created_at: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string
  
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<{
    appointments: boolean
    medications: boolean
    allergies: boolean
    notes: boolean
  }>({
    appointments: false,
    medications: false,
    allergies: false,
    notes: false
  })

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
        
        // Fetch patient details
        const patientRes = await fetch(apiPath(`/doctor/patients/${patientId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        
        if (!patientRes.ok) {
          throw new Error("Failed to load patient details")
        }
        
        const patientData = await patientRes.json()
        setPatient(patientData.patient)

        // Fetch patient appointments
        const appointmentsRes = await fetch(apiPath(`/doctor/patients/${patientId}/appointments`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json()
          setAppointments(appointmentsData.appointments || [])
        }

        // Fetch patient medications
        const medicationsRes = await fetch(apiPath(`/doctor/patients/${patientId}/medications`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        
        if (medicationsRes.ok) {
          const medicationsData = await medicationsRes.json()
          setMedications(medicationsData.medications || [])
        }

        // Fetch patient allergies
        const allergiesRes = await fetch(apiPath(`/doctor/patients/${patientId}/allergies`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        
        if (allergiesRes.ok) {
          const allergiesData = await allergiesRes.json()
          setAllergies(allergiesData.allergies || [])
        }

        // Fetch patient medical history
        const medicalHistoryRes = await fetch(apiPath(`/doctor/patients/${patientId}/medical-history`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        })
        
        if (medicalHistoryRes.ok) {
          const medicalHistoryData = await medicalHistoryRes.json()
          setMedicalHistory(medicalHistoryData.medicalHistory || [])
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) {
      fetchPatientData()
    }
  }, [patientId])

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
          Loading patient details…
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl border p-8 text-center">
          <p className="text-destructive mb-4">{error || "Patient not found"}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getGenderDisplay = (gender: string | null) => {
    if (!gender) return "N/A"
    switch (gender.toString()) {
      case "1":
        return "Male"
      case "2":
        return "Female"
      case "3":
        return "Other"
      default:
        return gender
    }
  }

  const toggleCard = (cardType: 'appointments' | 'medications' | 'allergies' | 'notes') => {
    setExpandedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }))
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{patient.name}</h1>
            <p className="text-muted-foreground">Patient ID: {patient.patient_id}</p>
          </div>

        </div>
      </div>

      <div className="space-y-6">
        {/* Patient Information */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{patient.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{patient.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date of Birth:</span>
                    <span>{formatDate(patient.date_of_birth)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Gender:</span>
                    <span>{getGenderDisplay(patient.gender)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Patient Since:</span>
                    <span>{formatDate(patient.created_at)}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Address:</span>
                      <span>{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {patient.emergency_contact && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Emergency Contact:</span>
                    <span>{patient.emergency_contact}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Appointments
                </div>
                <button 
                  onClick={() => toggleCard('appointments')}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  {expandedCards.appointments ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            {expandedCards.appointments && (
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No appointments found</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.appointment_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <div>
                            <p className="font-medium text-sm">
                              {formatDateTime(appointment.start_at)}
                            </p>
                            {appointment.reason && (
                              <p className="text-xs text-muted-foreground">{appointment.reason}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PillBottle className="h-5 w-5" />
                  Medications
                </div>
                <button 
                  onClick={() => toggleCard('medications')}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  {expandedCards.medications ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            {expandedCards.medications && (
              <CardContent>
                {medications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No current medications</p>
                ) : (
                  <div className="space-y-3">
                    {medications.map((medication) => (
                      <div key={medication.medication_id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{medication.medication_name}</p>
                            {medication.dosage && (
                              <p className="text-xs text-muted-foreground mt-1">Dosage: {medication.dosage}</p>
                            )}
                            {medication.frequency && (
                              <p className="text-xs text-muted-foreground">Frequency: {medication.frequency}</p>
                            )}
                            {medication.start_date && (
                              <p className="text-xs text-muted-foreground">
                                Start: {formatDate(medication.start_date)}
                                {medication.end_date && ` - End: ${formatDate(medication.end_date)}`}
                              </p>
                            )}
                          </div>
                          {medication.status && (
                            <Badge className={medication.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {medication.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </div>
                <button 
                  onClick={() => toggleCard('allergies')}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  {expandedCards.allergies ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            {expandedCards.allergies && (
              <CardContent>
                {allergies.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No known allergies</p>
                ) : (
                  <div className="space-y-3">
                    {allergies.map((allergy) => (
                      <div key={allergy.allergy_id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{allergy.allergy_name}</p>
                            {allergy.reaction && (
                              <p className="text-xs text-muted-foreground mt-1">Reaction: {allergy.reaction}</p>
                            )}
                            {allergy.notes && (
                              <p className="text-xs text-muted-foreground">Notes: {allergy.notes}</p>
                            )}
                          </div>
                          {allergy.severity && (
                            <Badge className={
                              allergy.severity.toLowerCase() === 'severe' ? 'bg-red-100 text-red-800' :
                              allergy.severity.toLowerCase() === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {allergy.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </div>
                <button 
                  onClick={() => toggleCard('notes')}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  {expandedCards.notes ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            {expandedCards.notes && (
              <CardContent>
                {medicalHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No medical history available</p>
                ) : (
                  <div className="space-y-3">
                    {medicalHistory.map((record) => (
                      <div key={record.history_id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">{record.condition}</p>
                          {record.diagnosis_date && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(record.diagnosis_date)}
                            </span>
                          )}
                        </div>
                        {record.treatment && (
                          <p className="text-xs text-muted-foreground mb-1">Treatment: {record.treatment}</p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-muted-foreground">Notes: {record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}