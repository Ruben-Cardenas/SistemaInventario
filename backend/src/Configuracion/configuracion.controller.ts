import type { Response } from "express";
import { z } from "zod";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerUbicaciones,
  obtenerEstadoSistema,
} from "./configuracion.service.js";

/**
 * Validación de configuración
 */
const configuracionSchema = z.object({
  nombre_sistema: z
    .string()
    .min(
      1,
      "El nombre del sistema es obligatorio",
    )
    .max(100),

  nombre_empresa: z
    .string()
    .min(
      1,
      "El nombre de la empresa es obligatorio",
    )
    .max(150),

  correo_administrativo: z
    .string()
    .email(
      "El correo administrativo no es válido",
    )
    .max(150),

  ubicacion_principal_id: z
    .number()
    .int()
    .positive()
    .nullable(),

  moneda: z
    .string()
    .min(1)
    .max(10),

  idioma: z
    .string()
    .min(1)
    .max(10),

  notificar_stock_bajo: z.boolean(),

  notificar_movimientos: z.boolean(),

  notificar_nuevos_usuarios: z.boolean(),

  resumen_diario: z.boolean(),

  contrasenas_seguras: z.boolean(),

  cierre_automatico: z.boolean(),

  proteccion_sesion: z.boolean(),

  stock_minimo: z
    .number()
    .int()
    .min(0),
});

/**
 * GET /api/configuracion
 */
export async function obtenerConfiguracionController(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const configuracion =
      await obtenerConfiguracion();

    res.json({
      success: true,
      message:
        "Configuración obtenida correctamente",
      data: configuracion,
    });
  } catch (error) {
    console.error(
      "Error obteniendo configuración:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo obtener la configuración",
    });
  }
}

/**
 * PUT /api/configuracion
 */
export async function actualizarConfiguracionController(
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

    const datos =
      configuracionSchema.parse(req.body);

    const configuracion =
      await actualizarConfiguracion(
        req.usuario,
        datos,
      );

    res.json({
      success: true,
      message:
        "Configuración actualizada correctamente",
      data: configuracion,
    });
  } catch (error) {
    console.error(
      "Error actualizando configuración:",
      error,
    );

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message:
          "Los datos enviados no son válidos",
        errores: error.issues,
      });

      return;
    }

    if (error instanceof Error) {
      if (
        error.message.includes(
          "Solo el administrador",
        )
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });

        return;
      }

      if (
        error.message.includes(
          "No se proporcionaron cambios",
        )
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });

        return;
      }
    }

    res.status(500).json({
      success: false,
      message:
        "No se pudo actualizar la configuración",
    });
  }
}

/**
 * GET /api/configuracion/ubicaciones
 */
export async function obtenerUbicacionesController(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const ubicaciones =
      await obtenerUbicaciones();

    res.json({
      success: true,
      message:
        "Ubicaciones obtenidas correctamente",
      data: ubicaciones,
    });
  } catch (error) {
    console.error(
      "Error obteniendo ubicaciones:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron obtener las ubicaciones",
    });
  }
}

/**
 * GET /api/configuracion/estado
 */
export async function obtenerEstadoSistemaController(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const estado =
      await obtenerEstadoSistema();

    res.json({
      success: true,
      message:
        "Estado del sistema obtenido correctamente",
      data: estado,
    });
  } catch (error) {
    console.error(
      "Error obteniendo estado del sistema:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo obtener el estado del sistema",
    });
  }
}