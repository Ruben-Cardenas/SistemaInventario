import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  obtenerUsuarios,
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
} from "./usuarios.service.js";

const estadoSchema = z.object({
  activo: z.boolean(),
});

const passwordSchema = z.object({
  nuevaPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
});

export async function obtenerUsuariosController(
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

    const usuarios = await obtenerUsuarios();

    res.json({
      success: true,
      message: "Usuarios obtenidos correctamente",
      data: usuarios,
    });
  } catch (error) {
    console.error(
      "Error obteniendo usuarios:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "No se pudieron obtener los usuarios",
    });
  }
}

export async function cambiarEstadoUsuarioController(
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

    const usuarioId = Number(req.params.id);

    if (!Number.isInteger(usuarioId)) {
      res.status(400).json({
        success: false,
        message: "El ID del usuario no es válido",
      });
      return;
    }

    const datos = estadoSchema.parse(req.body);

    const usuario = await cambiarEstadoUsuario(
      req.usuario,
      usuarioId,
      datos.activo,
    );

    res.json({
      success: true,
      message: datos.activo
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente",
      data: usuario,
    });
  } catch (error) {
    console.error(
      "Error cambiando estado del usuario:",
      error,
    );

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Los datos enviados no son válidos",
        errores: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      const mensajes403 = [
        "Solo el administrador puede activar o desactivar usuarios",
        "El administrador no puede desactivar su propia cuenta",
        "La cuenta del administrador no puede ser desactivada",
      ];

      if (
        mensajes403.includes(error.message)
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message === "El usuario no existe" ||
        error.message === "El ID del usuario no es válido"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message:
        "No se pudo cambiar el estado del usuario",
    });
  }
}

export async function cambiarPasswordUsuarioController(
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

    const usuarioId = Number(req.params.id);

    if (!Number.isInteger(usuarioId)) {
      res.status(400).json({
        success: false,
        message: "El ID del usuario no es válido",
      });
      return;
    }

    const datos = passwordSchema.parse(req.body);

    const usuario = await cambiarPasswordUsuario(
      req.usuario,
      usuarioId,
      datos.nuevaPassword,
    );

    res.json({
      success: true,
      message:
        "Contraseña actualizada correctamente",
      data: usuario,
    });
  } catch (error) {
    console.error(
      "Error cambiando contraseña:",
      error,
    );

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "La contraseña no es válida",
        errores: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      if (
        error.message ===
        "Solo el administrador puede cambiar contraseñas"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "La contraseña del administrador no puede modificarse desde este módulo"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message === "El usuario no existe" ||
        error.message === "El ID del usuario no es válido"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "La contraseña debe tener al menos 8 caracteres"
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
        "No se pudo actualizar la contraseña",
    });
  }
}