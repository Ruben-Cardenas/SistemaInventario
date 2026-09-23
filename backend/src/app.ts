import "dotenv/config";
import express from "express";
import cors from "cors";

import pool from "./config/database.js";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./Dashboard/dashboard.routes.js";
import productosRoutes from "./Productos/productos.routes.js";
import movimientosRoutes from "./Movimientos/movimientos.routes.js";
import sucursalesRoutes from "./Sucursales/sucursales.routes.js";
import configuracionRoutes from "./Configuracion/configuracion.routes.js";
import usuariosRoutes from "./Usuarios/usuarios.routes.js";

import {
  authMiddleware,
  type AuthRequest,
} from "./middlewares/auth.middleware.js";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message:
      "API del sistema de inventario funcionando",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS fecha",
    );

    res.json({
      success: true,
      message:
        "Conexión con PostgreSQL funcionando",
      database: process.env.DB_NAME,
      fecha: result.rows[0].fecha,
    });
  } catch (error) {
    console.error(
      "Error de PostgreSQL:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo conectar con PostgreSQL",
    });
  }
});

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/dashboard",
  dashboardRoutes,
);

app.use(
  "/api/productos",
  productosRoutes,
);

app.use(
  "/api/movimientos",
  movimientosRoutes,
);

app.use(
  "/api/sucursales",
  sucursalesRoutes,
);

app.use(
  "/api/configuracion",
  configuracionRoutes,
);

app.use(
  "/api/usuarios",
  usuariosRoutes,
);

app.get(
  "/api/auth/me",
  authMiddleware,
  (req: AuthRequest, res) => {
    res.json({
      success: true,
      message: "Usuario autenticado",
      usuario: req.usuario,
    });
  },
);

export default app;