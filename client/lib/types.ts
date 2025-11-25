export type AppointmentStatus = "scheduled" | "checked_in" | "completed" | "canceled" | "no_show"

export type UserRole = "patient" | "doctor" | "staff"

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  insuranceProvider?: string
  insuranceId?: string
}

export interface Provider {
  id: string
  name: string
  specialty: string
  email: string
  phone: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  providerId: string
  providerName: string
  providerSpecialty: string
  date: string
  time: string
  duration: number
  status: AppointmentStatus
  reason: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FileUpload {
  id: string
  patientId: string
  name: string
  type: string
  size: number
  uploadedAt: string
  url: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  appointmentId: string
  date: string
  diagnosis: string
  symptoms: string[]
  treatment: string
  medications: Medication[]
  notes: string
  doctorId: string
  doctorName: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export interface MedicalRecordQuery {
  patientFirstName?: string
  patientLastName?: string
  dateFrom?: string
  dateTo?: string
  symptoms?: string[]
  doctorId?: string
}

export interface MedicalRecordReport {
  query: MedicalRecordQuery
  totalRecords: number
  records: MedicalRecord[]
  summary: {
    mostCommonDiagnosis: string[]
    mostCommonSymptoms: string[]
    mostPrescribedMedications: string[]
    dateRange: {
      earliest: string
      latest: string
    }
  }
}
