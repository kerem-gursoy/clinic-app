import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { pool } from "../../db/pool.js";
import { getJwtSecret } from "../../config/env.js";
import { getFirstNameForRole } from "../users/user.service.js";

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

  const firstName = await getFirstNameForRole(row.user_id, row.role);
  const token = signToken(user);

  return {
    token,
    user: {
      ...user,
      first_name: firstName,
    },
  };
}

export function signToken(user) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

