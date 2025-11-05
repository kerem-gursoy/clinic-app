import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getMyAppointments, searchPatients } from "./patient.controller.js";

const router = Router();

router.get("/patient/appointments", requireAuth, requireRole("PATIENT"), getMyAppointments);
router.get("/patients/search", requireAuth, requireRole("STAFF", "DOCTOR"), searchPatients);

export default router;
