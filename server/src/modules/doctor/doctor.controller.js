import { getRecentDoctorAppointments, getRecentPatientAppointments } from "../appointments/appointment.service.js";
import { 
  listPatientsForDoctor, 
  findPatientById, 
  getPatientFullDetails,
  getPatientMedications, 
  getPatientAllergies, 
  getPatientMedicalHistory,
  getPatientEmergencyContacts
} from "../users/user.service.js";

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
    
    // Enhance patient data with medications and allergies
    const enhancedPatients = await Promise.all(
      patients.map(async (patient) => {
        try {
          const [medications, allergies] = await Promise.all([
            getPatientMedications(patient.patient_id),
            getPatientAllergies(patient.patient_id)
          ]);
          
          return {
            ...patient,
            medications: medications.map(med => med.medication_name || med.name),
            allergies: allergies.map(allergy => allergy.allergy_name || allergy.allergen_name)
          };
        } catch (err) {
          console.warn(`Failed to fetch additional data for patient ${patient.patient_id}:`, err);
          return {
            ...patient,
            medications: [],
            allergies: []
          };
        }
      })
    );
    
    return res.json({ patients: enhancedPatients });
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
    // Get comprehensive patient information
    const patientData = await getPatientFullDetails(patientId);
    if (!patientData) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get the last visit date from appointments
    const recentAppointments = await getRecentPatientAppointments(patientId, { limit: 1 });
    if (recentAppointments.length > 0) {
      patientData.last_visit = recentAppointments[0].start_at;
    }

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
    // Get all appointments for this patient
    const appointments = await getRecentPatientAppointments(patientId, { limit: 50 });
    
    return res.json({ appointments });
  } catch (err) {
    console.error("doctor/patient appointments error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient appointments" });
  }
}

export async function getPatientMedicationsForDoctor(req, res) {
  const authUser = req.user;
  const { patientId } = req.params;

  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // Get medications for this patient
    const medications = await getPatientMedications(patientId);
    
    return res.json({ medications });
  } catch (err) {
    console.error("doctor/patient medications error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient medications" });
  }
}

export async function getPatientAllergiesForDoctor(req, res) {
  const authUser = req.user;
  const { patientId } = req.params;

  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // Get allergies for this patient
    const allergies = await getPatientAllergies(patientId);
    
    return res.json({ allergies });
  } catch (err) {
    console.error("doctor/patient allergies error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient allergies" });
  }
}

export async function getPatientMedicalHistoryForDoctor(req, res) {
  const authUser = req.user;
  const { patientId } = req.params;

  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // Get medical history for this patient
    const medicalHistory = await getPatientMedicalHistory(patientId);
    
    return res.json({ medicalHistory });
  } catch (err) {
    console.error("doctor/patient medical history error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patient medical history" });
  }
}

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

