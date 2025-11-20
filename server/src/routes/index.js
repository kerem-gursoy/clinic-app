import { Router } from "express";
let appointmentRoutes, authRoutes, doctorRoutes, patientRoutes, profileRoutes, reportRoutes, staffRoutes, userRoutes;
try {
  appointmentRoutes = (await import("../modules/appointments/appointment.router.js")).default;
  authRoutes = (await import("../modules/auth/auth.router.js")).default;
  doctorRoutes = (await import("../modules/doctor/doctor.router.js")).default;
  patientRoutes = (await import("../modules/patient/patient.router.js")).default;
  profileRoutes = (await import("../modules/profile/profile.router.js")).default;
  reportRoutes = (await import("../modules/reports/report.router.js")).default;
  staffRoutes = (await import("../modules/staff/staff.router.js")).default;
  userRoutes = (await import("../modules/users/user.router.js")).default;
} catch (err) {
  console.error("Route import failed:", err);
  process.exit(1);
}
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

