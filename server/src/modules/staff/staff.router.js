import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getStaffAppointments, getStaffDoctors, getStaffPatients, getPatientUpdateLogs } from "./staff.controller.js";
import { createPatient } from "../users/user.service.js";

const router = Router();

router.get("/staff/appointments", requireAuth, requireRole("STAFF"), getStaffAppointments);
router.get("/staff/patients", requireAuth, requireRole("STAFF"), getStaffPatients);
router.get("/staff/doctors", requireAuth, requireRole("STAFF"), getStaffDoctors);

// New notifications endpoint to fetch `patient_update_log`
router.get("/staff/notifications", requireAuth, requireRole("STAFF"), getPatientUpdateLogs);

router.post(
  "/staff/patients",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    try {
      const result = await createPatient(req.body);
      res.status(201).json({
        success: true,
        message: "Patient created successfully.",
        patientId: result.patientId,
      });
    } catch (err) {
      console.error("Error creating patient:", err);
      res.status(500).json({
        success: false,
        error: "Failed to create patient",
        details: err.message,
      });
    }
  }
);

export default router;

