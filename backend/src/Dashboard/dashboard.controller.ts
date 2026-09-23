import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { obtenerDashboard } from "./dashboard.service.js";

export async function dashboardController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.usuario) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });

      return;
    }

    const dashboard = await obtenerDashboard(req.usuario);

    res.status(200).json({
      success: true,
      message: "Datos del dashboard obtenidos correctamente",
      data: dashboard,
    });
  } catch (error) {
    console.error("Error al obtener dashboard:", error);

    res.status(500).json({
      success: false,
      message: "No se pudieron obtener los datos del dashboard",
    });
  }
}