import { pool } from "./pool.js";

export async function list({ date, providerId, patientId, status }: any) {
  let sql = "SELECT * FROM appointments WHERE 1=1";
  const params: any[] = [];
  if (date) { sql += " AND DATE(start_time)=?"; params.push(date); }
  if (providerId) { sql += " AND provider_id=?"; params.push(providerId); }
  if (patientId) { sql += " AND patient_id=?"; params.push(patientId); }
  if (status) { sql += " AND status=?"; params.push(status); }
  sql += " ORDER BY start_time ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getOne(id: number) {
  const [rows] = await pool.query("SELECT * FROM appointments WHERE id=?", [id]);
  return (rows as any[])[0] || null;
}

export async function create(p: any) {
  const [r] = await pool.execute(
    "INSERT INTO appointments (patient_id, provider_id, start_time, end_time, reason, status) VALUES (?, ?, ?, ?, ?, ?)",
    [p.patientId, p.providerId, p.start, p.end, p.reason ?? null, p.status ?? "scheduled"]
  );
  return (r as any).insertId as number;
}

export async function update(id: number, patch: any) {
  const [r] = await pool.execute(
    "UPDATE appointments SET start_time=?, end_time=?, status=?, reason=? WHERE id=?",
    [patch.start, patch.end, patch.status, patch.reason, id]
  );
  return r;
}

export async function remove(id: number) {
  await pool.execute("DELETE FROM appointments WHERE id=?", [id]);
}

export async function listForPatient(
  patientId: number,
  opts: { startDate?: string; endDate?: string; status?: string } = {}
) {
  let sql = `
    SELECT
      a.*,
      d.doc_fname AS doctor_first_name,
      d.doc_lname AS doctor_last_name,
      d.specialty AS doctor_specialty
    FROM appointments a
    LEFT JOIN doctor d ON d.doctor_id = a.provider_id
    WHERE a.patient_id = ?
  `;
  const params: any[] = [patientId];

  if (opts.startDate) {
    sql += " AND a.start_time >= ?";
    params.push(opts.startDate);
  }

  if (opts.endDate) {
    sql += " AND a.start_time <= ?";
    params.push(opts.endDate);
  }

  if (opts.status) {
    sql += " AND a.status = ?";
    params.push(opts.status);
  }

  sql += " ORDER BY a.start_time ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function listForDoctor(
  doctorId: number,
  opts: { date?: string; includePast?: boolean } = {}
) {
  let sql = 
  `SELECT
      a.*,
      p.patient_fname AS patient_first_name,
      p.patient_lname AS patient_last_name
    FROM appointments a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    WHERE a.provider_id = ?`;
  const params: any[] = [doctorId];

  if (!opts.includePast) {
    sql += " AND a.start_time >= NOW()";
  }

  if (opts.date) {
    sql += " AND DATE(a.start_time) = ?";
    params.push(opts.date);
  }

  sql += " ORDER BY a.start_time ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function listAllForStaff(
  opts: { startDate?: string; endDate?: string; status?: string; limit?: number; offset?: number } = {}
) {
  let sql = `
    SELECT
      a.*,
      p.patient_fname AS patient_first_name,
      p.patient_lname AS patient_last_name,
      d.doc_fname AS doctor_first_name,
      d.doc_lname AS doctor_last_name
    FROM appointments a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    LEFT JOIN doctor d ON d.doctor_id = a.provider_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (opts.startDate) {
    sql += " AND a.start_time >= ?";
    params.push(opts.startDate);
  }

  if (opts.endDate) {
    sql += " AND a.start_time <= ?";
    params.push(opts.endDate);
  }

  if (opts.status) {
    sql += " AND a.status = ?";
    params.push(opts.status);
  }

  sql += " ORDER BY a.start_time ASC";

  if (typeof opts.limit === "number") {
    sql += " LIMIT ?";
    params.push(opts.limit);
  }

  if (typeof opts.offset === "number") {
    sql += " OFFSET ?";
    params.push(opts.offset);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function countByStatus() {
  const [rows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM appointments GROUP BY status"
  );
  return rows;
}

export async function updateStatus(
  id: number,
  status: string,
  opts: { notes?: string; updatedBy?: number } = {}
) {
  const params: any[] = [status, opts.notes ?? null];
  let sql = `
    UPDATE appointments
    SET status = ?, notes = ?, updated_at = NOW()
  `;

  if (typeof opts.updatedBy === "number") {
    sql += ", updated_by = ?";
    params.push(opts.updatedBy);
  }

  sql += " WHERE id = ?";
  params.push(id);

  const [result] = await pool.execute(sql, params);
  return result;
}

export async function listBetween(
  start: string,
  end: string,
  doctorId?: number
) {
  let sql = `
    SELECT *
    FROM appointments
    WHERE start_time BETWEEN ? AND ?
  `;
  const params: any[] = [start, end];

  if (typeof doctorId === "number") {
    sql += " AND provider_id = ?";
    params.push(doctorId);
  }

  sql += " ORDER BY start_time ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getUpcomingForPatient(patientId: number, limit = 5) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM appointments
      WHERE patient_id = ?
        AND start_time >= NOW()
      ORDER BY start_time ASC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows;
}
