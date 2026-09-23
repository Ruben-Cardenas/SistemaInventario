import { Router } from "express";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  listarSucursalesController,
  listarInventarioSucursalController,
} from "./sucursales.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  listarSucursalesController,
);

router.get(
  "/:id/inventario",
  listarInventarioSucursalController,
);

export default router;