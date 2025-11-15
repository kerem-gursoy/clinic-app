import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { 
  getMyAppointments, 
  getMyPatients, 
  getPatientDetails, 
  getPatientAppointmentsForDoctor 
} from "./doctor.controller.js";

const router = Router();

router.get("/doctor/appointments", requireAuth, requireRole("DOCTOR"), getMyAppointments);
router.get("/doctor/patients", requireAuth, requireRole("DOCTOR"), getMyPatients);
router.get("/doctor/patients/:patientId", requireAuth, requireRole("DOCTOR"), getPatientDetails);
router.get("/doctor/patients/:patientId/appointments", requireAuth, requireRole("DOCTOR"), getPatientAppointmentsForDoctor);

export default router;

