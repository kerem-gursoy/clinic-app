import { Router, type Request, type Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../schedule/pool.js";
import { requireAuth, requireRole } from "../auth/routes.js"; // reuse existing middleware

const router = Router();

/**
 * GET /patient/appointments
 * Returns all appointments for the currently authenticated patient.
 * Requires: valid JWT (handled by requireAuth) and role "PATIENT".
 */
router.get(
  "/appointments",
  requireAuth,
  requireRole("PATIENT"),
  async (req: Request, res: Response) => {
    try {
      // We know req.user exists because requireAuth already verified it.
      // The "!" tells TypeScript to trust us that it's not undefined.
      const { email } = (req as any).user!;
    
      // Fetch patient record for this email
      const [patients] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM patient WHERE patient_email = ? LIMIT 1",
        [email]
      );

      const patient = patients[0];
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      

      // Fetch the patient's appointments
      const [appointments] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM appointment WHERE patient_id = ? ORDER BY start_at DESC",
        [patient.patient_id]
      );
      
      return res.json({ patient, appointments });
    } catch (err) {
      console.error("Fetching patient appointments failed", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;