import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  obtenerSucursales,
  obtenerInventarioSucursal,
} from "./sucursales.service.js";

export async function listarSucursalesController(
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

    const sucursales = await obtenerSucursales();

    res.status(200).json({
      success: true,
      message: "Sucursales obtenidas correctamente",
      data: sucursales,
    });
  } catch (error) {
    console.error(
      "Error al obtener sucursales:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron obtener las sucursales",
    });
  }
}

export async function listarInventarioSucursalController(
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

    const ubicacionId = Number(req.params.id);

    if (
      !Number.isInteger(ubicacionId) ||
      ubicacionId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "El ID de la ubicación no es válido",
      });

      return;
    }

    const inventario =
      await obtenerInventarioSucursal(
        req.usuario,
        ubicacionId,
      );

    res.status(200).json({
      success: true,
      message:
        "Inventario de la ubicación obtenido correctamente",
      data: inventario,
    });
  } catch (error) {
    console.error(
      "Error al obtener inventario de sucursal:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo obtener el inventario";

    if (
      message.includes("No tienes permiso") ||
      message.includes(
        "no tiene una ubicación asignada",
      )
    ) {
      res.status(403).json({
        success: false,
        message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
}