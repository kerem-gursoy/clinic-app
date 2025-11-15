import { getRecentDoctorAppointments, getRecentPatientAppointments } from "../appointments/appointment.service.js";
import { listPatientsForDoctor, findPatientById } from "../users/user.service.js";

export async function getMyAppointments(req, res) {
  const authUser = req.user;
  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = parseLimit(req.query.limit, 50, 1, 200);

  try {
    const appointments = await getRecentDoctorAppointments(authUser.user_id, { limit });
    return res.json({ appointments, limit });
  } catch (err) {
    console.error("doctor/appointments error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load appointments" });
  }
}

export async function getMyPatients(req, res) {
  const authUser = req.user;
  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const patients = await listPatientsForDoctor(authUser.user_id);
    return res.json({ patients });
  } catch (err) {
    console.error("doctor/patients error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patients" });
  }
}

export async function getPatientDetails(req, res) {
  const authUser = req.user;
  const { patientId } = req.params;

  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // First verify this patient is associated with this doctor
    const doctorPatients = await listPatientsForDoctor(authUser.user_id);
    const hasAccess = doctorPatients.some(p => p.patient_id === parseInt(patientId));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this patient" });
    }

    // Get detailed patient information
    const patient = await findPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Transform the patient data to match the expected format
    const patientData = {
      patient_id: patient.patient_id,
      name: [patient.patient_fname, patient.patient_lname].filter(Boolean).join(" ").trim(),
      email: patient.patient_email,
      phone: patient.phone,
      date_of_birth: patient.dob,
      gender: patient.gender,
      address: null, // You'll need to join with address table if needed
      emergency_contact: null, // Add this field to patient table if needed
      medical_history: null, // Add this field to patient table if needed
      created_at: patient.created_at,
      last_visit: null // This will be populated separately
    };

    return res.json({ patient: patientData });
  } catch (err) {
    console.error("doctor/patient details error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient details" });
  }
}

export async function getPatientAppointmentsForDoctor(req, res) {
  const authUser = req.user;
  const { patientId } = req.params;

  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // Verify access to this patient
    const doctorPatients = await listPatientsForDoctor(authUser.user_id);
    const hasAccess = doctorPatients.some(p => p.patient_id === parseInt(patientId));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this patient" });
    }

    // Get appointments for this patient
    const appointments = await getRecentPatientAppointments(patientId, { limit: 50 });
    
    // Filter to only show appointments with this doctor
    const filteredAppointments = appointments.filter(apt => apt.doctor_id === authUser.user_id);
    
    return res.json({ appointments: filteredAppointments });
  } catch (err) {
    console.error("doctor/patient appointments error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient appointments" });
  }
}

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

