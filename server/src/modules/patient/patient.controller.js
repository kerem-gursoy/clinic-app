import { getRecentPatientAppointments } from "../appointments/appointment.service.js";
import { updatePatientById, findPatientById, findPatientByEmail, searchPatients as searchPatientsService } from "../users/user.service.js";

export async function getMyAppointments(req, res) {
  const authUser = req.user;
  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = parseLimit(req.query.limit, 50, 1, 200);

  try {
    const [appointments, patient] = await Promise.all([
      getRecentPatientAppointments(authUser.user_id, { limit }),
      loadPatientProfile(authUser),
    ]);

    return res.json({ appointments, limit, patient });
  } catch (err) {
    console.error("patient/appointments error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load appointments" });
  }
}

export async function searchPatients(req, res) {
  try {
    const query = String(req.query.q ?? "").trim();
    if (!query) {
      return res.json({ patients: [] });
    }

    const limit = parseLimit(req.query.limit, 25, 1, 200);
    const patients = await searchPatientsService(query, limit);
    return res.json({ patients });
  } catch (err) {
    console.error("patients/search error:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}

async function loadPatientProfile(authUser) {
  if (authUser.role !== "PATIENT") {
    return null;
  }

  const patient = await findPatientById(authUser.user_id);
  if (patient) {
    return patient;
  }

  if (authUser.email) {
    return findPatientByEmail(authUser.email);
  }

  return null;
}

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

export async function getPatient(req, res) {
  const { id } = req.params;
  const authUser = req.user;

  if (!authUser) return res.status(401).json({ error: "Unauthorized" });

  try {
    const patient = await findPatientById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    return res.json({ patient });
  } catch (err) {
    console.error("Error fetching patient:", err);
    return res.status(500).json({ error: "Failed to fetch patient" });
  }
}

export async function updatePatient(req, res) {
  const { id } = req.params;
  const authUser = req.user;

  // Only the patient themself (or staff) can update
  if (!authUser) return res.status(401).json({ error: "Unauthorized" });
  if (authUser.role === "PATIENT" && Number(authUser.user_id) !== Number(id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { patient_fname, patient_lname, patient_minit, patient_email, phone, dob } = req.body;

  try {
    const existing = await findPatientById(id);
    if (!existing) return res.status(404).json({ error: "Patient not found" });

    const updated = await updatePatientById(id, {
      patient_fname,
      patient_lname,
      patient_minit,
      patient_email,
      phone,
      dob,
    });

    return res.json({ message: "Patient updated successfully", patient: updated });
  } catch (err) {
    console.error("patient update error:", err);
    return res.status(500).json({ error: err.message ?? "Failed to update patient" });
  }
}

export async function getPatientProfile(req, res) {
  const authUser = req.user;
  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const patient = await findPatientById(authUser.user_id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    return res.json({ patient });
  } catch (err) {
    console.error("Error fetching patient profile:", err);
    return res.status(500).json({ error: "Failed to fetch patient profile" });
  }
}

export async function deletePatient(req, res) {
  const { id } = req.params;
  const authUser = req.user;

  if (!authUser) return res.status(401).json({ error: "Unauthorized" });

  // Only the patient themself (or staff/doctor) can delete
  if (authUser.role === "PATIENT" && Number(authUser.user_id) !== Number(id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const existing = await findPatientById(id);
    if (!existing) return res.status(404).json({ error: "Patient not found" });

    const { deletePatientById } = await import("../users/user.service.js");
    await deletePatientById(id);

    return res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("patient delete error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to delete patient" });
  }
}