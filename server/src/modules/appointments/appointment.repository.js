import { pool } from "../../db/pool.js";

export async function findAppointments({ date, providerId, patientId, status } = {}) {
  let sql = "SELECT * FROM appointment WHERE 1=1";
  const params = [];

  if (date) {
    sql += " AND DATE(start_at)=?";
    params.push(date);
  }

  if (providerId) {
    sql += " AND doctor_id=?";
    params.push(providerId);
  }

  if (patientId) {
    sql += " AND patient_id=?";
    params.push(patientId);
  }

  if (status) {
    sql += " AND status=?";
    params.push(status);
  }

  sql += " ORDER BY start_at ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function findAppointmentById(id) {
  const [rows] = await pool.query("SELECT * FROM appointment WHERE appointment_id=?", [id]);
  return rows?.[0] ?? null;
}

export async function insertAppointment({ patientId, providerId, start, end, reason, status }) {
  const doctorId = providerId && providerId !== "unassigned" ? providerId : null;

  const [result] = await pool.execute(
    "INSERT INTO appointment (patient_id, doctor_id, start_at, end_at, reason, status) VALUES (?, ?, ?, ?, ?, ?)",
    [patientId, doctorId, start, end, reason ?? null, status ?? "scheduled"]
  );

  return result.insertId;
}

export async function updateAppointment(id, patch) {
  const [result] = await pool.execute(
    "UPDATE appointment SET start_at=?, end_at=?, status=?, reason=? WHERE appointment_id=?",
    [patch.start, patch.end, patch.status, patch.reason, id]
  );
  return result;
}

export async function deleteAppointment(id) {
  await pool.execute("DELETE FROM appointment WHERE appointment_id=?", [id]);
}

export async function listAppointmentsForPatient(patientId, { startDate, endDate, status } = {}) {
  let sql = `
    SELECT
      a.*,
      d.doc_fname AS doctor_first_name,
      d.doc_lname AS doctor_last_name,
      d.specialty AS doctor_specialty
    FROM appointment a
    LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
    WHERE a.patient_id = ?
  `;

  const params = [patientId];

  if (startDate) {
    sql += " AND a.start_at >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND a.start_at <= ?";
    params.push(endDate);
  }

  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }

  sql += " ORDER BY a.start_at ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function listAppointmentsForDoctor(doctorId, { date, includePast } = {}) {
  let sql = `
    SELECT
      a.*,
      p.patient_fname AS patient_first_name,
      p.patient_lname AS patient_last_name
    FROM appointment a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    WHERE a.doctor_id = ?
  `;

  const params = [doctorId];

  if (!includePast) {
    sql += " AND a.start_at >= NOW()";
  }

  if (date) {
    sql += " AND DATE(a.start_at) = ?";
    params.push(date);
  }

  sql += " ORDER BY a.start_at ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function listAllAppointmentsForStaff({ startDate, endDate, status, limit, offset } = {}) {
  let sql = `
    SELECT
      a.*,
      p.patient_fname AS patient_first_name,
      p.patient_lname AS patient_last_name,
      d.doc_fname AS doctor_first_name,
      d.doc_lname AS doctor_last_name
    FROM appointment a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
    WHERE 1=1
  `;

  const params = [];

  if (startDate) {
    sql += " AND a.start_at >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND a.start_at <= ?";
    params.push(endDate);
  }

  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }

  sql += " ORDER BY a.start_at ASC";

  if (typeof limit === "number") {
    sql += " LIMIT ?";
    params.push(limit);
  }

  if (typeof offset === "number") {
    sql += " OFFSET ?";
    params.push(offset);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

