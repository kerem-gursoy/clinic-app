import { pool } from "../../db/pool.js";
import { calculateDuration, formatAppointmentTime } from "../../utils/datetime.js";
import * as appointmentRepository from "./appointment.repository.js";

export async function listAppointments(filters = {}) {
  return appointmentRepository.findAppointments(filters);
}

export async function getAppointmentById(id) {
  return appointmentRepository.findAppointmentById(id);
}

export async function createAppointment(payload) {
  const { patientId, providerId, start, end } = payload;

  // Check for overlapping appointments for the patient
  if (patientId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM appointment WHERE patient_id = ? AND NOT (end_at <= ? OR start_at >= ?) LIMIT 1`,
      [patientId, start, end]
    );
    if (rows && rows.length) {
      const err = new Error("Patient already has an appointment at that time");
      // attach an HTTP status so controller can respond appropriately
      err.status = 409;
      throw err;
    }
  }

  // Check for overlapping appointments for the doctor (if assigned)
  const doctorId = providerId && providerId !== "unassigned" ? providerId : null;
  if (doctorId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM appointment WHERE doctor_id = ? AND NOT (end_at <= ? OR start_at >= ?) LIMIT 1`,
      [doctorId, start, end]
    );
    if (rows && rows.length) {
      const err = new Error("Doctor already has an appointment at that time");
      err.status = 409;
      throw err;
    }
  }

  return appointmentRepository.insertAppointment(payload);
}

export async function updateAppointment(id, patch) {
  return appointmentRepository.updateAppointment(id, patch);
}

export async function removeAppointment(id) {
  return appointmentRepository.deleteAppointment(id);
}

export async function listAppointmentsForPatient(patientId, options = {}) {
  return appointmentRepository.listAppointmentsForPatient(patientId, options);
}

export async function listAppointmentsForDoctor(doctorId, options = {}) {
  return appointmentRepository.listAppointmentsForDoctor(doctorId, options);
}

export async function listAllAppointmentsForStaff(options = {}) {
  return appointmentRepository.listAllAppointmentsForStaff(options);
}

export async function getRecentPatientAppointments(patientId, { limit = 50 } = {}) {
  const normalizedLimit = normalizeLimit(limit, 1, 200);
  const [rows] = await pool.query(
    `SELECT a.*, d.doc_fname, d.doc_lname
       FROM appointment a
       LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.start_at DESC
       LIMIT ?`,
    [patientId, normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? patientId,
    provider_id: row.doctor_id ?? null,
    providerName: buildName(row.doc_fname, row.doc_lname),
    reason: row.reason ?? null,
    status: row.status ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

export async function getRecentDoctorAppointments(doctorId, { limit = 50 } = {}) {
  const normalizedLimit = normalizeLimit(limit, 1, 200);
  const [rows] = await pool.query(
    `SELECT a.*, p.patient_fname, p.patient_lname, d.doc_fname, d.doc_lname
       FROM appointment a
       LEFT JOIN patient p ON a.patient_id = p.patient_id
       LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
       WHERE a.doctor_id = ?
       ORDER BY a.start_at DESC
       LIMIT ?`,
    [doctorId, normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? null,
    provider_id: row.doctor_id ?? doctorId,
    providerName: buildName(row.doc_fname, row.doc_lname),
    patientName: buildName(row.patient_fname, row.patient_lname),
    reason: row.reason ?? null,
    status: row.status ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

export async function getRecentStaffAppointments({ limit = 100 } = {}) {
  const normalizedLimit = normalizeLimit(limit, 1, 500);
  const [rows] = await pool.query(
    `SELECT a.*,
            p.patient_fname, p.patient_lname,
            d.doc_fname, d.doc_lname
       FROM appointment a
       LEFT JOIN patient p ON a.patient_id = p.patient_id
       LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
       ORDER BY a.start_at DESC
       LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? null,
    doctor_id: row.doctor_id ?? null,
    patientName: buildName(row.patient_fname, row.patient_lname),
    doctorName: buildName(row.doc_fname, row.doc_lname),
    status: row.status ?? null,
    reason: row.reason ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

function buildName(first, last) {
  return [first, last].filter(Boolean).join(" ").trim() || null;
}

function normalizeLimit(limit, min, max) {
  const value = Number.parseInt(String(limit), 10);
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

