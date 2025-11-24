import { Router } from "express";
import appointmentRoutes from "../modules/appointments/appointment.router.js";
import authRoutes from "../modules/auth/auth.router.js";
import doctorRoutes from "../modules/doctor/doctor.router.js";
import patientRoutes from "../modules/patient/patient.router.js";
import profileRoutes from "../modules/profile/profile.router.js";
import staffRoutes from "../modules/staff/staff.router.js";
import userRoutes from "../modules/users/user.router.js";
import reportsRouter from "../modules/reports/reports.router.js";

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(patientRoutes);
router.use(doctorRoutes);
router.use(staffRoutes);
router.use(profileRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/api/admin/reports", reportsRouter);

export default router;

