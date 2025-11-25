import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { 
  getMyAppointments, 
  getMyPatients, 
  getPatientDetails, 
  getPatientAppointmentsForDoctor,
  getPatientMedicationsForDoctor,
  getPatientAllergiesForDoctor,
  getPatientMedicalHistoryForDoctor,
  updateDoctorProfile,
  changeDoctorPassword
} from "./doctor.controller.js";

const router = Router();

router.get("/doctor/appointments", requireAuth, requireRole("DOCTOR"), getMyAppointments);
router.get("/doctor/patients", requireAuth, requireRole("DOCTOR"), getMyPatients);
router.get("/doctor/patients/:patientId", requireAuth, requireRole("DOCTOR"), getPatientDetails);
router.get("/doctor/patients/:patientId/appointments", requireAuth, requireRole("DOCTOR"), getPatientAppointmentsForDoctor);
router.get("/doctor/patients/:patientId/medications", requireAuth, requireRole("DOCTOR"), getPatientMedicationsForDoctor);
router.get("/doctor/patients/:patientId/allergies", requireAuth, requireRole("DOCTOR"), getPatientAllergiesForDoctor);
router.get("/doctor/patients/:patientId/medical-history", requireAuth, requireRole("DOCTOR"), getPatientMedicalHistoryForDoctor);
router.put("/doctor/profile", requireAuth, requireRole("DOCTOR"), updateDoctorProfile);
router.put("/doctor/password", requireAuth, requireRole("DOCTOR"), changeDoctorPassword);

export default router;

