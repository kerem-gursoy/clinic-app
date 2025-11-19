import argon2 from "argon2";
import { pool } from "../../db/pool.js";

function validationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

async function assertUnique(connection, query, value, message) {
  const [rows] = await connection.query(query, [value]);
  if (rows.length > 0) {
    throw validationError(message);
  }
}

export async function createPatient(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [patientResult] = await connection.query(
      `INSERT INTO patient (
        patient_fname, patient_lname, patient_minit, dob, gender,
        phone, address_id, balance, created_at, created_by,
        med_id, patient_email, prim_doctor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        data.patient_fname,
        data.patient_lname,
        data.patient_minit ?? null,
        data.dob ?? null,
        data.gender ?? null,
        data.phone ?? null,
        data.address_id ?? null,
        data.balance ?? 0,
        data.created_by ?? null,
        data.med_id ?? null,
        data.patient_email,
        data.prim_doctor ?? null,
      ]
    );

    const patientId = patientResult.insertId;
    const hash = await argon2.hash(data.password);

    await connection.query(
      `INSERT INTO login (user_id, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'PATIENT', NOW(), NOW())`,
      [patientId, data.patient_email, hash]
    );

    await connection.commit();
    return { success: true, patientId };
  } catch (err) {
    await connection.rollback();
    console.error("createPatient transaction failed:", err);
    throw err;
  } finally {
    connection.release();
  }
}

export async function createDoctor(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (!data.ssn) throw validationError("SSN is required");
    if (!data.license_no) throw validationError("License number is required");
    if (!data.doc_fname || !data.doc_lname) throw validationError("Doctor name is required");
    if (!data.email) throw validationError("Email is required");

    await assertUnique(connection, "SELECT doctor_id FROM doctor WHERE ssn = ? LIMIT 1", data.ssn, "A doctor with this SSN already exists");
    await assertUnique(connection, "SELECT doctor_id FROM doctor WHERE license_no = ? LIMIT 1", data.license_no, "A doctor with this license number already exists");
    await assertUnique(connection, "SELECT doctor_id FROM doctor WHERE email = ? LIMIT 1", data.email, "A doctor with this email already exists");
    await assertUnique(connection, "SELECT user_id FROM login WHERE email = ? LIMIT 1", data.email, "This email is already associated with another user");

    const [doctorResult] = await connection.query(
      `INSERT INTO doctor (
         ssn, license_no, gender, doc_fname, doc_lname,
         phone, email, availability, created_at, created_by, doc_minit
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        data.ssn,
        data.license_no,
        data.gender ?? null,
        data.doc_fname,
        data.doc_lname,
        data.phone ?? null,
        data.email,
        data.availability ?? null,
        data.created_by ?? null,
        data.doc_minit ?? null,
      ]
    );

    const doctorId = doctorResult.insertId;
    const hash = await argon2.hash(data.password);

    await connection.query(
      `INSERT INTO login (user_id, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'DOCTOR', NOW(), NOW())`,
      [doctorId, data.email, hash]
    );

    await connection.commit();
    return { success: true, doctorId };
  } catch (err) {
    await connection.rollback();
    console.error("createDoctor transaction failed:", err);
    throw err;
  } finally {
    connection.release();
  }
}

export async function createStaff(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [staffResult] = await connection.query(
      `INSERT INTO staff (
         staff_first_name, staff_last_name, staff_minit,
         role, email, phone, created_at, ssn, office_id
       ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        data.staff_first_name,
        data.staff_last_name,
        data.staff_minit ?? null,
        data.role ?? null,
        data.email,
        data.phone ?? null,
        data.ssn ?? null,
        data.office_id ?? null,
      ]
    );

    const staffId = staffResult.insertId;
    const hash = await argon2.hash(data.password);

    await connection.query(
      `INSERT INTO login (user_id, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'STAFF', NOW(), NOW())`,
      [staffId, data.email, hash]
    );

    await connection.commit();
    return { success: true, staffId };
  } catch (err) {
    await connection.rollback();
    console.error("createStaff transaction failed:", err);
    throw err;
  } finally {
    connection.release();
  }
}

export async function findPatientByEmail(email) {
  const [rows] = await pool.query(
    "SELECT * FROM patient WHERE patient_email = ? LIMIT 1",
    [email]
  );
  return rows?.[0] ?? null;
}

export async function findPatientById(patientId) {
  const [rows] = await pool.query(
    "SELECT * FROM patient WHERE patient_id = ? LIMIT 1",
    [patientId]
  );
  return rows?.[0] ?? null;
}

export async function findDoctorById(doctorId) {
  const [rows] = await pool.query(
    "SELECT * FROM doctor WHERE doctor_id = ? LIMIT 1",
    [doctorId]
  );
  return rows?.[0] ?? null;
}

export async function findStaffById(staffId) {
  const [rows] = await pool.query(
    "SELECT * FROM staff WHERE staff_id = ? LIMIT 1",
    [staffId]
  );
  return rows?.[0] ?? null;
}

export async function searchPatients(term, limit = 25) {
  const normalizedLimit = normalizeLimit(limit, 1, 200);
  const like = `%${String(term).replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const [rows] = await pool.query(
    `SELECT patient_id, patient_fname, patient_minit, patient_lname, patient_email
       FROM patient
       WHERE CONCAT(patient_fname, ' ', patient_lname) LIKE ?
          OR patient_email LIKE ?
       LIMIT ?`,
    [like, like, normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: row.patient_id,
    patient_fname: row.patient_fname,
    patient_minit: row.patient_minit,
    patient_lname: row.patient_lname,
    patient_email: row.patient_email,
  }));
}

export async function listPatientsForStaff(limit = 200) {
  const normalizedLimit = normalizeLimit(limit, 1, 500);
  const [rows] = await pool.query(
    `SELECT patient_id, patient_fname, patient_minit, patient_lname, patient_email, phone, dob
       FROM patient
       ORDER BY patient_fname ASC
       LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_minit, row.patient_lname].filter(Boolean).join(" ").trim(),
    email: row.patient_email ?? null,
    phone: row.phone ?? null,
    dob: row.dob ?? null,
  }));
}

export async function listDoctorsForStaff(limit = 200) {
  const normalizedLimit = normalizeLimit(limit, 1, 500);
  const [rows] = await pool.query(
    `SELECT doctor_id, doc_fname, doc_lname, phone
       FROM doctor
       ORDER BY doc_fname ASC
       LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    doctor_id: Number(row.doctor_id),
    name: [row.doc_fname, row.doc_lname].filter(Boolean).join(" ").trim(),
    specialty: null,
    email: null,
    phone: row.phone ?? null,
  }));
}

export async function listPatientsForDoctor(doctorId, limit = 200) {
  const normalizedLimit = normalizeLimit(limit, 1, 500);
  const [rows] = await pool.query(
    `SELECT DISTINCT p.patient_id,
            p.patient_fname,
            p.patient_lname,
            p.patient_email,
            p.phone,
            MAX(a.start_at) AS last_visit
       FROM appointment a
       JOIN patient p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ?
       GROUP BY p.patient_id, p.patient_fname, p.patient_lname, p.patient_email, p.phone
       ORDER BY last_visit DESC
       LIMIT ?`,
    [doctorId, normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_lname].filter(Boolean).join(" ").trim(),
    email: row.patient_email ?? null,
    phone: row.phone ?? null,
    last_visit: row.last_visit ?? null,
  }));
}

export async function getFirstNameForRole(userId, role) {
  if (role === "PATIENT") {
    const patient = await findPatientById(userId);
    return patient?.patient_fname ?? null;
  }

  if (role === "DOCTOR") {
    const doctor = await findDoctorById(userId);
    return doctor?.doc_fname ?? null;
  }

  if (role === "STAFF") {
    const staff = await findStaffById(userId);
    return staff?.staff_first_name ?? null;
  }

  return null;
}

function normalizeLimit(value, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return min;
  }
  return Math.min(Math.max(parsed, min), max);
}

export async function updatePatientById(id, updates) {
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (!fields.length) return findPatientById(id);

  const sql = `
    UPDATE patient
    SET ${fields.join(", ")}
    WHERE patient_id = ?
  `;
  values.push(id);

  await pool.query(sql, values); // assumes you're using db.query(pool, etc.)
  return findPatientById(id);
}

export async function deletePatientById(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete dependent appointments first to satisfy FK constraints
    await connection.query(`DELETE FROM appointment WHERE patient_id = ?`, [id]);

    // Remove login entry for the patient if exists
    await connection.query(`DELETE FROM login WHERE user_id = ?`, [id]);

    // Remove patient record
    await connection.query(`DELETE FROM patient WHERE patient_id = ?`, [id]);

    await connection.commit();
    return { success: true };
  } catch (err) {
    await connection.rollback();
    console.error("deletePatientById transaction failed:", err);
    throw err;
  } finally {
    connection.release();
  }
}