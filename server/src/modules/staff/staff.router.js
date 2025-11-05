import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getStaffAppointments, getStaffDoctors, getStaffPatients } from "./staff.controller.js";

const router = Router();

router.get("/staff/appointments", requireAuth, requireRole("STAFF"), getStaffAppointments);
router.get("/staff/patients", requireAuth, requireRole("STAFF"), getStaffPatients);
router.get("/staff/doctors", requireAuth, requireRole("STAFF"), getStaffDoctors);

export default router;

