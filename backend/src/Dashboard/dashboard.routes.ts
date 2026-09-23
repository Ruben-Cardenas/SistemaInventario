import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  dashboardController,
);

export default router;