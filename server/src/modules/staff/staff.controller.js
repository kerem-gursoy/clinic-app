import { getRecentStaffAppointments } from "../appointments/appointment.service.js";
import { listDoctorsForStaff, listPatientsForStaff } from "../users/user.service.js";

export async function getStaffAppointments(req, res) {
  const limit = parseLimit(req.query.limit, 100, 1, 500);

  try {
    const appointments = await getRecentStaffAppointments({ limit });
    return res.json({ appointments, limit });
  } catch (err) {
    console.error("staff/appointments error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load appointments" });
  }
}

export async function getStaffPatients(_req, res) {
  try {
    const patients = await listPatientsForStaff();
    return res.json({ patients });
  } catch (err) {
    console.error("staff/patients error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load patients" });
  }
}

export async function getStaffDoctors(_req, res) {
  try {
    const doctors = await listDoctorsForStaff();
    return res.json({ doctors });
  } catch (err) {
    console.error("staff/doctors error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load doctors" });
  }
}

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

