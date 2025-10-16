import type { Appointment, Patient, Provider, FileUpload } from "./types"

export const mockPatients: Patient[] = [
  {
    id: "p1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "(555) 123-4567",
    dateOfBirth: "1985-03-15",
    insuranceProvider: "Blue Cross",
    insuranceId: "BC123456789",
  },
  {
    id: "p2",
    name: "Michael Chen",
    email: "mchen@email.com",
    phone: "(555) 234-5678",
    dateOfBirth: "1990-07-22",
    insuranceProvider: "Aetna",
    insuranceId: "AET987654321",
  },
]

export const mockProviders: Provider[] = [
  {
    id: "pr1",
    name: "Dr. Emily Rodriguez",
    specialty: "Family Medicine",
    email: "e.rodriguez@clinic.com",
    phone: "(555) 111-2222",
  },
  {
    id: "pr2",
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    email: "j.wilson@clinic.com",
    phone: "(555) 333-4444",
  },
  {
    id: "pr3",
    name: "Dr. Lisa Park",
    specialty: "Dermatology",
    email: "l.park@clinic.com",
    phone: "(555) 555-6666",
  },
]

export const mockAppointments: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    patientName: "Sarah Johnson",
    providerId: "pr1",
    providerName: "Dr. Emily Rodriguez",
    providerSpecialty: "Family Medicine",
    date: "2025-10-20",
    time: "09:00",
    duration: 30,
    status: "scheduled",
    reason: "Annual checkup",
    notes: "Patient requested morning appointment",
    createdAt: "2025-10-10T10:00:00Z",
    updatedAt: "2025-10-10T10:00:00Z",
  },
  {
    id: "a2",
    patientId: "p1",
    patientName: "Sarah Johnson",
    providerId: "pr2",
    providerName: "Dr. James Wilson",
    providerSpecialty: "Cardiology",
    date: "2025-10-25",
    time: "14:30",
    duration: 45,
    status: "scheduled",
    reason: "Follow-up consultation",
    createdAt: "2025-10-12T14:00:00Z",
    updatedAt: "2025-10-12T14:00:00Z",
  },
  {
    id: "a3",
    patientId: "p1",
    patientName: "Sarah Johnson",
    providerId: "pr1",
    providerName: "Dr. Emily Rodriguez",
    providerSpecialty: "Family Medicine",
    date: "2025-09-15",
    time: "10:00",
    duration: 30,
    status: "completed",
    reason: "Flu symptoms",
    notes: "Prescribed medication",
    createdAt: "2025-09-10T09:00:00Z",
    updatedAt: "2025-09-15T10:30:00Z",
  },
]

export const mockFiles: FileUpload[] = [
  {
    id: "f1",
    patientId: "p1",
    name: "Insurance Card - Front.jpg",
    type: "image/jpeg",
    size: 245000,
    uploadedAt: "2025-10-01T12:00:00Z",
    url: "/insurance-card-front.jpg",
  },
  {
    id: "f2",
    patientId: "p1",
    name: "Insurance Card - Back.jpg",
    type: "image/jpeg",
    size: 238000,
    uploadedAt: "2025-10-01T12:01:00Z",
    url: "/insurance-card-back.jpg",
  },
]
