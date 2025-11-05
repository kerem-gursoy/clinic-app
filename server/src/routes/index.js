import { Router } from "express";
import appointmentRoutes from "../modules/appointments/appointment.router.js";
import authRoutes from "../modules/auth/auth.router.js";
import doctorRoutes from "../modules/doctor/doctor.router.js";
import patientRoutes from "../modules/patient/patient.router.js";
import profileRoutes from "../modules/profile/profile.router.js";
import reportRoutes from "../modules/reports/report.router.js";
import staffRoutes from "../modules/staff/staff.router.js";
import userRoutes from "../modules/users/user.router.js";

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(patientRoutes);
router.use(doctorRoutes);
router.use(staffRoutes);
router.use(reportRoutes);
router.use(profileRoutes);
router.use("/appointments", appointmentRoutes);

export default router;

