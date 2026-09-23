import { Router } from "express";

import {
  authMiddleware,
  requireRole,
} from "../middlewares/auth.middleware.js";

import {
  listarProductosController,
  obtenerProductoController,
  crearProductoController,
  actualizarProductoController,
  cambiarEstadoProductoController,
  listarCategoriasController,
  listarInventarioController,
} from "./productos.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  listarProductosController,
);

router.get(
  "/categorias",
  listarCategoriasController,
);

router.get(
  "/inventario",
  listarInventarioController,
);

router.get(
  "/:id",
  obtenerProductoController,
);

router.post(
  "/",
  requireRole("admin"),
  crearProductoController,
);

router.put(
  "/:id",
  requireRole("admin"),
  actualizarProductoController,
);

router.patch(
  "/:id/estado",
  requireRole("admin"),
  cambiarEstadoProductoController,
);

export default router;