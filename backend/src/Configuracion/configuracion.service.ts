import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

export interface ConfiguracionData {
  nombre_sistema: string;
  nombre_empresa: string;
  correo_administrativo: string;
  ubicacion_principal_id: number | null;
  moneda: string;
  idioma: string;

  notificar_stock_bajo: boolean;
  notificar_movimientos: boolean;
  notificar_nuevos_usuarios: boolean;
  resumen_diario: boolean;

  contrasenas_seguras: boolean;
  cierre_automatico: boolean;
  proteccion_sesion: boolean;

  stock_minimo: number;
}

/**
 * Obtener la configuración actual
 */
export async function obtenerConfiguracion() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.nombre_sistema,
      c.nombre_empresa,
      c.correo_administrativo,

      c.ubicacion_principal_id,
      u.nombre AS ubicacion_principal,

      c.moneda,
      c.idioma,

      c.notificar_stock_bajo,
      c.notificar_movimientos,
      c.notificar_nuevos_usuarios,
      c.resumen_diario,

      c.contrasenas_seguras,
      c.cierre_automatico,
      c.proteccion_sesion,

      c.stock_minimo,

      c.fecha_creacion,
      c.fecha_actualizacion

    FROM configuracion c

    LEFT JOIN ubicaciones u
      ON u.id = c.ubicacion_principal_id

    ORDER BY c.id ASC

    LIMIT 1
  `);

  if (result.rows.length === 0) {
    throw new Error(
      "No existe una configuración del sistema",
    );
  }

  return result.rows[0];
}

/**
 * Actualizar configuración
 */
export async function actualizarConfiguracion(
  usuario: AuthPayload,
  datos: Partial<ConfiguracionData>,
) {
  // Solamente el administrador puede modificar configuración
  if (usuario.rol !== "admin") {
    throw new Error(
      "Solo el administrador puede modificar la configuración",
    );
  }

  const camposPermitidos: Array<
    keyof ConfiguracionData
  > = [
    "nombre_sistema",
    "nombre_empresa",
    "correo_administrativo",
    "ubicacion_principal_id",
    "moneda",
    "idioma",

    "notificar_stock_bajo",
    "notificar_movimientos",
    "notificar_nuevos_usuarios",
    "resumen_diario",

    "contrasenas_seguras",
    "cierre_automatico",
    "proteccion_sesion",

    "stock_minimo",
  ];

  const campos: string[] = [];
  const valores: unknown[] = [];

  for (const campo of camposPermitidos) {
    if (datos[campo] !== undefined) {
      campos.push(
        `${campo} = $${valores.length + 1}`,
      );

      valores.push(datos[campo]);
    }
  }

  if (campos.length === 0) {
    throw new Error(
      "No se proporcionaron cambios para guardar",
    );
  }

  valores.push(new Date());

  const result = await pool.query(
    `
    UPDATE configuracion

    SET
      ${campos.join(", ")},
      fecha_actualizacion = $${valores.length}

    WHERE id = (
      SELECT id
      FROM configuracion
      ORDER BY id ASC
      LIMIT 1
    )

    RETURNING id
    `,
    valores,
  );

  if (result.rows.length === 0) {
    throw new Error(
      "No se encontró la configuración para actualizar",
    );
  }

  return await obtenerConfiguracion();
}

/**
 * Obtener ubicaciones disponibles
 */
export async function obtenerUbicaciones() {
  const result = await pool.query(`
    SELECT
      id,
      nombre,
      descripcion,
      activa

    FROM ubicaciones

    WHERE activa = TRUE

    ORDER BY
      CASE
        WHEN nombre = 'Matriz' THEN 1
        WHEN nombre = 'Saucos' THEN 2
        WHEN nombre = '450' THEN 3
        ELSE 4
      END,
      nombre ASC
  `);

  return result.rows;
}

/**
 * Obtener estado de la API y PostgreSQL
 */
export async function obtenerEstadoSistema() {
  let baseDatos = false;

  try {
    await pool.query("SELECT NOW()");
    baseDatos = true;
  } catch (error) {
    console.error(
      "Error comprobando PostgreSQL:",
      error,
    );
  }

  let configuracion = false;

  try {
    const result = await pool.query(`
      SELECT id
      FROM configuracion
      LIMIT 1
    `);

    configuracion = result.rows.length > 0;
  } catch (error) {
    console.error(
      "Error comprobando configuración:",
      error,
    );
  }

  return {
    api: true,
    baseDatos,
    configuracion,
    sistema: baseDatos && configuracion
      ? "operativo"
      : "con problemas",

    version: "1.0.0",

    frontend: "React + Vite",

    backend: "Node.js + Express",

    base_datos: "PostgreSQL",

    api_tipo: "REST API",
  };
}