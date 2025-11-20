import argon2 from "argon2";
import { pool } from "../../db/pool.js";

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
    `SELECT patient_id, patient_fname, patient_lname, patient_email
       FROM patient
       WHERE CONCAT(patient_fname, ' ', patient_lname) LIKE ?
          OR patient_email LIKE ?
       LIMIT ?`,
    [like, like, normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: row.patient_id,
    patient_fname: row.patient_fname,
    patient_lname: row.patient_lname,
    patient_email: row.patient_email,
  }));
}

export async function listPatientsForStaff(limit = 200) {
  const normalizedLimit = normalizeLimit(limit, 1, 500);
  const [rows] = await pool.query(
    `SELECT patient_id, patient_fname, patient_lname, patient_email, phone, dob
       FROM patient
       ORDER BY patient_fname ASC
       LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_lname].filter(Boolean).join(" ").trim(),
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
  
  // Return all patients for doctors, with last visit information if available
  const [rows] = await pool.query(
    `SELECT p.patient_id,
            p.patient_fname,
            p.patient_lname,
            p.patient_email,
            p.phone,
            p.dob,
            (SELECT MAX(a.start_at) 
             FROM appointment a 
             WHERE a.patient_id = p.patient_id 
             AND a.doctor_id = ?) AS last_visit_with_doctor,
            (SELECT MAX(a2.start_at) 
             FROM appointment a2 
             WHERE a2.patient_id = p.patient_id) AS last_visit_any
       FROM patient p
       ORDER BY p.patient_fname ASC, p.patient_lname ASC
       LIMIT ?`,
    [doctorId, normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_lname].filter(Boolean).join(" ").trim(),
    email: row.patient_email ?? null,
    phone: row.phone ?? null,
    date_of_birth: row.dob ?? null,
    last_visit: row.last_visit_with_doctor ?? row.last_visit_any ?? null,
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

export async function getPatientEmergencyContacts(patientId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        econtact_id,
        first_name,
        last_name,
        phone,
        relationship
      FROM emergency_contact
      WHERE patient_id = ?
      ORDER BY econtact_id`,
      [patientId]
    );
    
    return rows.map(row => ({
      contact_id: row.econtact_id,
      name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
      phone: row.phone,
      relationship: row.relationship
    })) || [];
  } catch (err) {
    console.log("Emergency contacts query failed:", err.message);
    return [];
  }
}

export async function getPatientMedications(patientId) {
  try {
    // Check if tables exist first
    const [tableCheck] = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('medication', 'patient_medication')"
    );
    
    if (tableCheck[0].count < 2) {
      console.log("Medications tables do not exist in database");
      return [];
    }

    // Try to query the medications tables
    const [rows] = await pool.query(
      `SELECT 
        m.medication_id,
        m.name as medication_name,
        pm.dosage,
        'Daily' as frequency,
        pm.start_date,
        pm.end_date,
        pm.prescribed_by,
        CASE 
          WHEN pm.end_date IS NULL OR pm.end_date > CURDATE() THEN 'active'
          ELSE 'discontinued'
        END as status
      FROM patient_medication pm
      JOIN medication m ON pm.med_id = m.medication_id
      WHERE pm.patient_id = ?
      ORDER BY pm.start_date DESC`,
      [patientId]
    );
    return rows || [];
  } catch (err) {
    // If tables don't exist or query fails, return empty array
    console.log("Medications query failed:", err.message);
    return [];
  }
}

export async function getPatientAllergies(patientId) {
  try {
    // Check if tables exist first
    const [tableCheck] = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('allergies', 'patient_allergy')"
    );
    
    if (tableCheck[0].count < 2) {
      console.log("Allergies tables do not exist in database");
      return [];
    }

    // Try to query the allergies tables
    const [rows] = await pool.query(
      `SELECT 
        a.allergy_id,
        a.allergen_name as allergy_name,
        'Moderate' as severity,
        a.allergy_description as reaction,
        a.allergy_description as notes
      FROM patient_allergy pa
      JOIN allergies a ON pa.alrgy_id = a.allergy_id
      WHERE pa.pat_id = ?
      ORDER BY a.allergen_name`,
      [patientId]
    );
    return rows || [];
  } catch (err) {
    // If tables don't exist or query fails, return empty array
    console.log("Allergies query failed:", err.message);
    return [];
  }
}

export async function getPatientMedicalHistory(patientId) {
  try {
    // Check if table exists first
    const [tableCheck] = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'medical_history'"
    );
    
    if (tableCheck[0].count === 0) {
      console.log("Medical history table does not exist in database");
      return [];
    }

    // Try to query the medical history table
    const [rows] = await pool.query(
      `SELECT 
        history_id,
        condition_name as \`condition\`,
        diagnosis_date,
        description as treatment,
        description as notes,
        created_by as doctor_id,
        created_at
      FROM medical_history
      WHERE patient_id = ?
      ORDER BY diagnosis_date DESC, created_at DESC`,
      [patientId]
    );
    return rows || [];
  } catch (err) {
    // If table doesn't exist or query fails, return empty array
    console.log("Medical history query failed:", err.message);
    return [];
  }
}

export async function getPatientFullDetails(patientId) {
  try {
    const [patientRows] = await pool.query(
      `SELECT 
        p.patient_id,
        p.patient_fname,
        p.patient_lname,
        p.patient_minit,
        p.patient_email,
        p.phone,
        p.dob,
        p.gender,
        p.balance,
        p.created_at,
        p.prim_doctor,
        lg.gender_label,
        a.line1 as address_line1,
        a.line2 as address_line2,
        a.city,
        a.state,
        a.zip_code
      FROM patient p
      LEFT JOIN lookup_gender lg ON p.gender = lg.gender_id
      LEFT JOIN address a ON p.address_id = a.address_id
      WHERE p.patient_id = ?
      LIMIT 1`,
      [patientId]
    );
    
    if (patientRows.length === 0) {
      return null;
    }
    
    const patient = patientRows[0];
    
    // Format address
    let address = null;
    if (patient.address_line1) {
      address = [patient.address_line1, patient.address_line2, patient.city, patient.state, patient.zip_code]
        .filter(Boolean).join(", ");
    }
    
    // Get emergency contacts
    const emergencyContacts = await getPatientEmergencyContacts(patientId);
    const primaryEmergencyContact = emergencyContacts.length > 0 
      ? `${emergencyContacts[0].name} (${emergencyContacts[0].relationship}) - ${emergencyContacts[0].phone}`
      : null;
    
    return {
      patient_id: patient.patient_id,
      name: [patient.patient_fname, patient.patient_lname].filter(Boolean).join(" ").trim(),
      email: patient.patient_email,
      phone: patient.phone,
      date_of_birth: patient.dob,
      gender: patient.gender,
      gender_label: patient.gender_label,
      address: address,
      emergency_contact: primaryEmergencyContact,
      emergency_contacts: emergencyContacts,
      balance: patient.balance,
      created_at: patient.created_at,
      primary_doctor_id: patient.prim_doctor
    };
  } catch (err) {
    console.error("getPatientFullDetails error:", err);
    throw err;
  }
}

function normalizeLimit(value, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return min;
  }
  return Math.min(Math.max(parsed, min), max);
}

