import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { getCurrentUser } from "./profile.controller.js";

const router = Router();

router.get("/me", requireAuth, getCurrentUser);

export default router;

