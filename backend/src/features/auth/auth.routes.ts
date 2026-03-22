import { Router } from "express";
import { apiLimiter } from "../../middleware/rateLimiter";
import { requireSession } from "./auth.middleware";
import { getMe } from "./auth.controller";

const router = Router();

// /me is an authenticated endpoint but not a brute-force target,
// so use apiLimiter (60/15min) instead of authLimiter (10/15min).
router.use(apiLimiter);

router.get("/me", requireSession, getMe);

export default router;
