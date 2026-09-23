import type { Response } from "express";
import { z } from "zod";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  obtenerCategorias,
  obtenerInventario,
} from "./productos.service.js";

const crearProductoSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "El SKU es obligatorio")
    .max(50, "El SKU no puede superar 50 caracteres"),

  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(
      150,
      "El nombre no puede superar 150 caracteres",
    ),

  categoria_id: z
    .number()
    .int()
    .positive("La categoría es obligatoria"),

  precio: z
    .number()
    .nonnegative(
      "El precio no puede ser negativo",
    ),
});

const actualizarProductoSchema =
  crearProductoSchema.partial();

const estadoSchema = z.object({
  estado: z.enum([
    "activo",
    "descontinuado",
  ]),
});

export async function listarProductosController(
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

    const productos = await obtenerProductos(
      req.usuario,
      {
        search:
          typeof req.query.search === "string"
            ? req.query.search
            : undefined,

        categoria:
          typeof req.query.categoria ===
          "string"
            ? req.query.categoria
            : undefined,

        estado:
          typeof req.query.estado === "string"
            ? req.query.estado
            : undefined,
      },
    );

    res.status(200).json({
      success: true,
      message:
        "Productos obtenidos correctamente",
      data: productos,
    });
  } catch (error) {
    console.error(
      "Error al listar productos:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron obtener los productos",
    });
  }
}

export async function listarInventarioController(
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

    const inventario = await obtenerInventario(
      req.usuario,
    );

    res.status(200).json({
      success: true,
      message:
        "Inventario obtenido correctamente",
      data: inventario,
    });
  } catch (error) {
    console.error(
      "Error al obtener inventario:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo obtener el inventario",
    });
  }
}

export async function obtenerProductoController(
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

    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "ID de producto inválido",
      });

      return;
    }

    const producto =
      await obtenerProductoPorId(
        id,
        req.usuario,
      );

    if (!producto) {
      res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error(
      "Error al obtener producto:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo obtener el producto",
    });
  }
}

export async function crearProductoController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validacion =
      crearProductoSchema.safeParse(
        req.body,
      );

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message:
          "Datos de producto inválidos",
        errors:
          validacion.error.flatten(),
      });

      return;
    }

    const producto =
      await crearProducto(
        validacion.data,
      );

    res.status(201).json({
      success: true,
      message:
        "Producto creado correctamente",
      data: producto,
    });
  } catch (error) {
    console.error(
      "Error al crear producto:",
      error,
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo crear el producto";

    if (
      mensaje.includes("SKU") ||
      mensaje.includes("categoría")
    ) {
      res.status(400).json({
        success: false,
        message: mensaje,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message:
        "No se pudo crear el producto",
    });
  }
}

export async function actualizarProductoController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "ID de producto inválido",
      });

      return;
    }

    const validacion =
      actualizarProductoSchema.safeParse(
        req.body,
      );

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message:
          "Datos de producto inválidos",
        errors:
          validacion.error.flatten(),
      });

      return;
    }

    const producto =
      await actualizarProducto(
        id,
        validacion.data,
      );

    if (!producto) {
      res.status(404).json({
        success: false,
        message:
          "Producto no encontrado",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Producto actualizado correctamente",
      data: producto,
    });
  } catch (error) {
    console.error(
      "Error al actualizar producto:",
      error,
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el producto";

    res.status(400).json({
      success: false,
      message: mensaje,
    });
  }
}

export async function cambiarEstadoProductoController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "ID de producto inválido",
      });

      return;
    }

    const validacion =
      estadoSchema.safeParse(
        req.body,
      );

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message:
          "El estado debe ser activo o descontinuado",
      });

      return;
    }

    const producto =
      await cambiarEstadoProducto(
        id,
        validacion.data.estado,
      );

    if (!producto) {
      res.status(404).json({
        success: false,
        message:
          "Producto no encontrado",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        validacion.data.estado ===
        "activo"
          ? "Producto reactivado correctamente"
          : "Producto descontinuado correctamente",
      data: producto,
    });
  } catch (error) {
    console.error(
      "Error al cambiar estado:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudo cambiar el estado del producto",
    });
  }
}

export async function listarCategoriasController(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const categorias =
      await obtenerCategorias();

    res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    console.error(
      "Error al obtener categorías:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "No se pudieron obtener las categorías",
    });
  }
}