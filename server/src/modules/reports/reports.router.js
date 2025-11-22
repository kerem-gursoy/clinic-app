import { Router } from "express";
import * as reportsController from "./reports.controller.js";
// import { requireAuth, requireRole } from "../../middleware/auth.js"; // Assuming auth middleware exists

const router = Router();

// TODO: Add auth middleware
router.get("/appointments", reportsController.getAppointmentReport);

export default router;
