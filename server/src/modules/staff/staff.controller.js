import { getRecentStaffAppointments } from "../appointments/appointment.service.js";
import { listDoctorsForStaff, listPatientsForStaff } from "../users/user.service.js";
import { pool } from "../../db/pool.js";

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

/**
 * GET /staff/notifications
 * Returns rows from `patient_update_log` joined with `patient` to include patient_name.
 * Optional query: ?limit=100
 */
export async function getPatientUpdateLogs(req, res) {
  const limit = parseLimit(req.query.limit, 200, 1, 1000);

  try {
    const [rows] = await pool.query(
      `SELECT 
         pul.log_id,
         pul.patient_id,
         pul.column_name,
         pul.new_value,
         pul.changed_at,
         -- Build a readable patient name: "First M. Last"
         CASE 
           WHEN p.patient_fname IS NULL AND p.patient_lname IS NULL THEN NULL
           ELSE CONCAT_WS(' ',
             p.patient_fname,
             (CASE WHEN p.patient_minit IS NULL OR p.patient_minit = '' THEN NULL ELSE CONCAT(p.patient_minit, '.') END),
             p.patient_lname
           )
         END AS patient_name
       FROM patient_update_log pul
       LEFT JOIN patient p ON p.patient_id = pul.patient_id
       ORDER BY pul.changed_at DESC
       LIMIT ?`,
      [limit]
    );

    return res.json({ logs: rows ?? [], limit });
  } catch (err) {
    console.error("staff/notifications error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to load notifications" });
  }
}

function parseLimit(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

