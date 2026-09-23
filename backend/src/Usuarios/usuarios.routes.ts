import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  obtenerUsuariosController,
  cambiarEstadoUsuarioController,
  cambiarPasswordUsuarioController,
} from "./usuarios.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  obtenerUsuariosController,
);

router.patch(
  "/:id/estado",
  cambiarEstadoUsuarioController,
);

router.patch(
  "/:id/password",
  cambiarPasswordUsuarioController,
);

export default router;