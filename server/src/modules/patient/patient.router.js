import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getPatientProfile, getMyAppointments, searchPatients, updatePatient, deletePatient, getPatient, changePatientPassword } from "./patient.controller.js";

const router = Router();

router.get("/patient/appointments", requireAuth, requireRole("PATIENT"), getMyAppointments);
router.get("/patients/search", requireAuth, requireRole("STAFF", "DOCTOR"), searchPatients);
router.get("/patient/profile", requireAuth, requireRole("PATIENT"), getPatientProfile);
router.get("/patients/:id", requireAuth, requireRole("STAFF", "DOCTOR"), getPatient);

router.put("/patients/:id", requireAuth, updatePatient);
router.put("/staff/patients/:id", requireAuth, requireRole("STAFF", "DOCTOR"), updatePatient);
router.put("/patient/password", requireAuth, requireRole("PATIENT"), changePatientPassword);
router.delete("/patients/:id", requireAuth, deletePatient);
router.delete("/staff/patients/:id", requireAuth, requireRole("STAFF", "DOCTOR"), deletePatient);

export default router;