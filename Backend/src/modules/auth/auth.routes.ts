import { Router } from "express";

import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from "./auth.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireTenant } from "../../middlewares/tenant.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticate, requireTenant, getMe);

export default router;