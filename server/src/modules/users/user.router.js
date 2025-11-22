import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { registerDoctor, registerPatient, registerStaff, removeDoctor } from "./user.controller.js";

const router = Router();

router.post("/doctors", requireAuth, requireRole("STAFF"), registerDoctor);
router.delete("/doctors/:doctorId", requireAuth, requireRole("STAFF"), removeDoctor);
router.post("/patients", requireAuth, requireRole("STAFF"), registerPatient);
router.post("/staff", requireAuth, requireRole("STAFF"), registerStaff);

export default router;