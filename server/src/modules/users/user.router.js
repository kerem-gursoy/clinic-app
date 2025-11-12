import { Router } from "express";
import { registerDoctor, registerPatient, registerStaff, removeDoctor } from "./user.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";

const router = Router();

router.post("/doctors", registerDoctor);
router.post("/patients", registerPatient);
router.post("/staff", registerStaff);
router.delete("/doctors/:doctorId", requireAuth, requireRole("STAFF"), removeDoctor);

export default router;