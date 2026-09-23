import type { Response } from "express";
import { z } from "zod";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  crearMovimiento,
  obtenerMovimientos,
} from "./movimientos.service.js";

const detalleMovimientoSchema =
  z.object({
    producto_id: z
      .number()
      .int()
      .positive(
        "El producto es obligatorio",
      ),

    cantidad: z
      .number()
      .int()
      .positive(
        "La cantidad debe ser mayor que 0",
      ),

    precio_unitario: z
      .number()
      .nonnegative()
      .optional(),
  });

const crearMovimientoSchema =
  z.object({
    tipo: z.enum([
      "entrada_proveedor",
      "traslado_sucursal",
    ]),

    origen_id: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    destino_id: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    detalles: z
      .array(detalleMovimientoSchema)
      .min(
        1,
        "El movimiento debe contener al menos un producto",
      ),

    observaciones: z
      .string()
      .trim()
      .max(
        500,
        "Las observaciones no pueden superar 500 caracteres",
      )
      .optional(),
  });

export async function listarMovimientosController(
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

    const movimientos =
      await obtenerMovimientos(
        req.usuario,
      );

    res.status(200).json({
      success: true,
      message:
        "Movimientos obtenidos correctamente",
      data: movimientos,
    });
  } catch (error) {
    console.error(
      "Error al listar movimientos:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron obtener los movimientos",
    });
  }
}

export async function crearMovimientoController(
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

    const resultado =
      crearMovimientoSchema.safeParse(
        req.body,
      );

    if (!resultado.success) {
      res.status(400).json({
        success: false,
        message:
          "Los datos del movimiento no son válidos",
        errors: resultado.error.issues,
      });

      return;
    }

    const movimiento =
      await crearMovimiento(
        req.usuario,
        resultado.data,
      );

    res.status(201).json({
      success: true,
      message:
        "Movimiento creado correctamente",
      data: movimiento,
    });
  } catch (error) {
    console.error(
      "Error al crear movimiento:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear el movimiento";

    /*
     * Errores provocados por datos o reglas
     * de negocio.
     */
    const erroresCliente = [
      "El movimiento debe contener al menos un producto",
      "Solo un administrador puede registrar entradas de proveedor",
      "No se encontró la ubicación Matriz",
      "El destino es obligatorio para un traslado",
      "La ubicación destino no existe o está inactiva",
      "El origen y destino no pueden ser iguales",
      "Los traslados solamente pueden realizarse hacia Saucos o 450",
      "No tienes permiso para realizar movimientos hacia esta sucursal",
      "Uno o más productos no existen o están descontinuados",
      "La cantidad de cada producto debe ser un número entero mayor que 0",
      "El precio del producto no es válido",
      "El producto no existe",
    ];

    const esErrorCliente =
      erroresCliente.some((mensaje) =>
        message.includes(mensaje),
      ) ||
      message.startsWith(
        "No existe stock",
      ) ||
      message.startsWith(
        "Stock insuficiente",
      ) ||
      message.startsWith(
        "No existe un registro de stock",
      );

    res.status(
      esErrorCliente ? 400 : 500,
    ).json({
      success: false,
      message,
    });
  }
}