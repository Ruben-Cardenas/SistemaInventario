import { Router } from "express";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  crearMovimientoController,
  listarMovimientosController,
} from "./movimientos.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  listarMovimientosController,
);

router.post(
  "/",
  crearMovimientoController,
);

export default router;