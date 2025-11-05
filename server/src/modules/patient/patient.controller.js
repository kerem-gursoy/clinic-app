import { getRecentPatientAppointments } from "../appointments/appointment.service.js";
import { findPatientById, findPatientByEmail, searchPatients as searchPatientsService } from "../users/user.service.js";

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
