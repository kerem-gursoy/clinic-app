import { Router } from "express";
import { login, logout, signupPatient } from "./auth.controller.js";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/signup", signupPatient);

export default router;
