import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getMyAppointments, getMyPatients } from "./doctor.controller.js";

const router = Router();

router.get("/doctor/appointments", requireAuth, requireRole("DOCTOR"), getMyAppointments);
router.get("/doctor/patients", requireAuth, requireRole("DOCTOR"), getMyPatients);

export default router;

