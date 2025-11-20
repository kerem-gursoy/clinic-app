import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { queryMedicalRecords } from "./report.controller.js";

const router = Router();

router.get("/doctor/medical-records/query", requireAuth, requireRole("DOCTOR"), queryMedicalRecords);

export default router;

