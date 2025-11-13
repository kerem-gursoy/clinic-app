import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {getPatientProfile, getMyAppointments, searchPatients, updatePatient } from "./patient.controller.js";

const router = Router();

router.get("/patient/appointments", requireAuth, requireRole("PATIENT"), getMyAppointments);
router.get("/patients/search", requireAuth, requireRole("STAFF", "DOCTOR"), searchPatients);
router.get("/patient/profile", requireAuth, requireRole("PATIENT"), getPatientProfile);


router.put("/patients/:id", requireAuth, updatePatient);
router.put("/staff/patients/:id", requireAuth, requireRole("STAFF", "DOCTOR"), updatePatient);


export default router;
