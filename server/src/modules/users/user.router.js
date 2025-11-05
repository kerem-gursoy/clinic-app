import { Router } from "express";
import { registerDoctor, registerPatient, registerStaff } from "./user.controller.js";

const router = Router();

router.post("/doctors", registerDoctor);
router.post("/patients", registerPatient);
router.post("/staff", registerStaff);

export default router;

