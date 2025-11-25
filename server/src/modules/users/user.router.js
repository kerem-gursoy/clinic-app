import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { registerDoctor, getDoctor, updateDoctorHandler, registerPatient, registerStaff, removeDoctor } from "./user.controller.js";

const router = Router();

router.post("/doctors", requireAuth, requireRole("STAFF"), registerDoctor);
router.get("/doctors/:doctorId", requireAuth, requireRole("STAFF"), getDoctor);
router.put("/doctors/:doctorId", requireAuth, requireRole("STAFF"), updateDoctorHandler);
router.delete("/doctors/:doctorId", requireAuth, requireRole("STAFF"), removeDoctor);
router.post("/patients", requireAuth, requireRole("STAFF"), registerPatient);
router.post("/staff", requireAuth, requireRole("STAFF"), registerStaff);

export default router;