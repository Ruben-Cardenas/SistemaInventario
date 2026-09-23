import { Router } from "express";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  obtenerConfiguracionController,
  actualizarConfiguracionController,
  obtenerUbicacionesController,
  obtenerEstadoSistemaController,
} from "./configuracion.controller.js";

const router = Router();

router.use(authMiddleware);

/*
 * Obtener configuración
 *
 * GET /api/configuracion
 */
router.get(
  "/",
  obtenerConfiguracionController,
);

/*
 * Actualizar configuración
 *
 * PUT /api/configuracion
 */
router.put(
  "/",
  actualizarConfiguracionController,
);

/*
 * Obtener ubicaciones
 *
 * GET /api/configuracion/ubicaciones
 */
router.get(
  "/ubicaciones",
  obtenerUbicacionesController,
);

/*
 * Obtener estado del sistema
 *
 * GET /api/configuracion/estado
 */
router.get(
  "/estado",
  obtenerEstadoSistemaController,
);

export default router;