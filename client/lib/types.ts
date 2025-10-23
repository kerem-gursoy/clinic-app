export type AppointmentStatus = "draft" | "scheduled" | "checked-in" | "in-room" | "completed" | "cancelled"

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
