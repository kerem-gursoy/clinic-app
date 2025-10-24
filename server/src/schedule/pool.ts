import mysql from 'mysql2/promise';
import argon2 from 'argon2';
import 'dotenv/config';

console.log('DB_HOST:', process.env.DB_HOST, 'DB_USER:', process.env.DB_USER);

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then((conn) => {
    console.log("DB connection OK");
    conn.release();
  })
  .catch((err) => {
    console.error("DB connection failed", err);
  });


interface NewPatient {
  patient_fname: string;
  patient_lname: string;
  patient_minit?: string | null;
  dob?: string | null;
  gender?: number | null;
  phone?: string | null;
  address_id?: number | null;
  balance?: number | null;
  created_by?: number | null;
  med_id?: number | null;
  patient_email: string;
  prim_doctor?: number | null;
  password: string;
}

interface NewDoctor {
  ssn: string;
  license_no: string;
  doc_fname: string;
  doc_lname: string;
  email: string;
  password: string;
  gender?: number | null;
  phone?: string | null;
  availability?: number | null;
  created_by?: number | null;
  doc_minit?: string | null;
}

export async function createPatient(data: NewPatient) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [patientResult]: any = await conn.query(
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
    await conn.query(
      `INSERT INTO login (user_id, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'PATIENT', NOW(), NOW())`,
      [patientId, data.patient_email, hash]
    );

    await conn.commit();
    return { success: true, patientId };
  } catch (err) {
    await conn.rollback();
    console.error('Transaction failed:', err);
    throw err;
  } finally {
    conn.release();
  }
}

export async function createDoctor(data: NewDoctor) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [docRes]: any = await conn.query(
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

    const doctorId = docRes.insertId;
    const hash = await argon2.hash(data.password);

    await conn.query(
      `INSERT INTO login (user_id, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, 'DOCTOR', NOW(), NOW())`,
      [doctorId, data.email, hash]
    );

    await conn.commit();
    return { success: true, doctorId };
  } catch (err) {
    await conn.rollback();
    console.error('createDoctor failed:', err);
    throw err;
  } finally {
    conn.release();
  }
}
