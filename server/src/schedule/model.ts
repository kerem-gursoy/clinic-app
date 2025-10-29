import { pool } from "./pool.js";

export async function list({ date, providerId, patientId, status }: any) {
  let sql = "SELECT * FROM appointment WHERE 1=1";
  const params: any[] = [];
  if (date) { sql += " AND DATE(start_at)=?"; params.push(date); }
  if (providerId) { sql += " AND doctor_id=?"; params.push(providerId); }
  if (patientId) { sql += " AND patient_id=?"; params.push(patientId); }
  if (status) { sql += " AND status=?"; params.push(status); }
  sql += " ORDER BY start_at ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getOne(id: number) {
  const [rows] = await pool.query("SELECT * FROM appointment WHERE appointment_id=?", [id]);
  return (rows as any[])[0] || null;
}

export async function create(p: any) {
  console.log('Creating appointment with params:', {
    patientId: p.patientId,
    providerId: p.providerId,
    start: p.start,
    end: p.end,
    reason: p.reason,
    status: p.status
  });
  
  // Handle null providerId (unassigned appointments)
  const doctorId = p.providerId && p.providerId !== 'unassigned' ? p.providerId : null;
  
  const [r] = await pool.execute(
    "INSERT INTO appointment (patient_id, doctor_id, start_at, end_at, reason, status) VALUES (?, ?, ?, ?, ?, ?)",
    [p.patientId, doctorId, p.start, p.end, p.reason ?? null, p.status ?? "scheduled"]
  );
  return (r as any).insertId as number;
}

export async function update(id: number, patch: any) {
  const [r] = await pool.execute(
    "UPDATE appointment SET start_at=?, end_at=?, status=?, reason=? WHERE appointment_id=?",
    [patch.start, patch.end, patch.status, patch.reason, id]
  );
  return r;
}

export async function remove(id: number) {
  await pool.execute("DELETE FROM appointment WHERE appointment_id=?", [id]);
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
    FROM appointment a
    LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
    WHERE a.patient_id = ?
  `;
  const params: any[] = [patientId];

  if (opts.startDate) {
    sql += " AND a.start_at >= ?";
    params.push(opts.startDate);
  }

  if (opts.endDate) {
    sql += " AND a.start_at <= ?";
    params.push(opts.endDate);
  }

  if (opts.status) {
    sql += " AND a.status = ?";
    params.push(opts.status);
  }

  sql += " ORDER BY a.start_at ASC";
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
    FROM appointment a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    WHERE a.doctor_id = ?`;
  const params: any[] = [doctorId];

  if (!opts.includePast) {
    sql += " AND a.start_at >= NOW()";
  }

  if (opts.date) {
    sql += " AND DATE(a.start_at) = ?";
    params.push(opts.date);
  }

  sql += " ORDER BY a.start_at ASC";
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
    FROM appointment a
    LEFT JOIN patient p ON p.patient_id = a.patient_id
    LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (opts.startDate) {
    sql += " AND a.start_at >= ?";
    params.push(opts.startDate);
  }

  if (opts.endDate) {
    sql += " AND a.start_at <= ?";
    params.push(opts.endDate);
  }

  if (opts.status) {
    sql += " AND a.status = ?";
    params.push(opts.status);
  }

  sql += " ORDER BY a.start_at ASC";

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
    "SELECT status, COUNT(*) AS total FROM appointment GROUP BY status"
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
    UPDATE appointment
    SET status = ?, notes = ?, updated_at = NOW()
  `;

  if (typeof opts.updatedBy === "number") {
    sql += ", updated_by = ?";
    params.push(opts.updatedBy);
  }

  sql += " WHERE appointment_id = ?";
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
    FROM appointment
    WHERE start_at BETWEEN ? AND ?
  `;
  const params: any[] = [start, end];

  if (typeof doctorId === "number") {
    sql += " AND doctor_id = ?";
    params.push(doctorId);
  }

  sql += " ORDER BY start_at ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getUpcomingForPatient(patientId: number, limit = 5) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM appointment
      WHERE patient_id = ?
        AND start_at >= NOW()
      ORDER BY start_at ASC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows;
}
