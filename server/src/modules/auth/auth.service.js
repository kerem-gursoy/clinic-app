import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { pool } from "../../db/pool.js";
import { getJwtSecret } from "../../config/env.js";
import { createPatient, getNamePartsForRole } from "../users/user.service.js";

export async function authenticateUser(email, password) {
  const [rows] = await pool.query(
    "SELECT user_id, email, password, role FROM login WHERE email = ? LIMIT 1",
    [email]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const passwordMatches = await argon2.verify(row.password, password);
  if (!passwordMatches) {
    return null;
  }

  const user = {
    user_id: row.user_id,
    role: row.role,
    email: row.email,
  };

  const { firstName, lastName } = await getNamePartsForRole(row.user_id, row.role);
  const token = signToken(user);

  return {
    token,
    user: {
      ...user,
      first_name: firstName,
      last_name: lastName,
    },
  };
}

export function signToken(user) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export async function registerPatient({ firstName, lastName, email, password, phone, dob, ssn }) {
  if (!password || password.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }
  if (!dob) {
    const err = new Error("Date of birth is required");
    err.statusCode = 400;
    throw err;
  }
  if (!ssn) {
    const err = new Error("SSN is required");
    err.statusCode = 400;
    throw err;
  }

  const result = await createPatient({
    patient_fname: firstName,
    patient_lname: lastName,
    patient_email: email,
    password,
    phone: phone ?? null,
    dob,
    patient_ssn: ssn,
    created_by: null,
    med_id: null,
    prim_doctor: null,
    address_id: null,
    balance: 0,
  });

  if (!result?.patientId) {
    throw new Error("Failed to create patient");
  }

  const token = signToken({ user_id: result.patientId, role: "PATIENT", email });
  const { firstName: fName, lastName: lName } = await getNamePartsForRole(result.patientId, "PATIENT");

  return {
    token,
    user: {
      user_id: result.patientId,
      email,
      role: "PATIENT",
      first_name: fName ?? firstName,
      last_name: lName ?? lastName,
    },
  };
}
