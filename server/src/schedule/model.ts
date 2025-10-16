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
  // Very basic example; in real code build dynamic SETs safely
  const [r] = await pool.execute(
    "UPDATE appointments SET start_time=?, end_time=?, status=?, reason=? WHERE id=?",
    [patch.start, patch.end, patch.status, patch.reason, id]
  );
  return r;
}

export async function remove(id: number) {
  await pool.execute("DELETE FROM appointments WHERE id=?", [id]);
}