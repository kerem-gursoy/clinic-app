import { Router } from "express";
import { login, logout } from "./auth.controller.js";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/logout", logout);

export default router;

