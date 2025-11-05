import { getRecentDoctorAppointments } from "../appointments/appointment.service.js";
import { listPatientsForDoctor } from "../users/user.service.js";

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

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

