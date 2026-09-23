import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

export async function obtenerSucursales() {
  const result = await pool.query(`
    SELECT
      u.id,
      u.nombre,
      u.descripcion,
      u.activa,

      CASE
        WHEN u.nombre = 'Matriz'
          THEN 'Almacén principal'
        ELSE 'Sucursal'
      END AS tipo,

      COUNT(
        CASE
          WHEN p.estado = 'activo'
            AND s.cantidad > 0
          THEN 1
        END
      )::int AS productos,

      COALESCE(
        SUM(
          CASE
            WHEN p.estado = 'activo'
            THEN s.cantidad
            ELSE 0
          END
        ),
        0
      )::int AS unidades,

      COUNT(
        CASE
          WHEN p.estado = 'activo'
            AND s.cantidad < s.stock_minimo
          THEN 1
        END
      )::int AS "stockBajo"

    FROM ubicaciones u

    LEFT JOIN stock s
      ON s.ubicacion_id = u.id

    LEFT JOIN productos p
      ON p.id = s.producto_id

    GROUP BY
      u.id,
      u.nombre,
      u.descripcion,
      u.activa

    ORDER BY u.id ASC
  `);

  return result.rows;
}

export async function obtenerInventarioSucursal(
  usuario: AuthPayload,
  ubicacionId: number,
) {
  if (usuario.rol !== "admin") {
    if (!usuario.ubicacion_id) {
      throw new Error(
        "El usuario encargado no tiene una ubicación asignada",
      );
    }

    if (usuario.ubicacion_id !== ubicacionId) {
      throw new Error(
        "No tienes permiso para consultar esta ubicación",
      );
    }
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.sku,
      p.nombre AS producto,
      c.nombre AS categoria,
      s.cantidad::int AS stock,
      s.stock_minimo::int AS minimo,
      p.precio,
      p.estado,
      CASE
        WHEN s.cantidad < s.stock_minimo
          THEN true
        ELSE false
      END AS stock_bajo
    FROM stock s

    INNER JOIN productos p
      ON p.id = s.producto_id

    INNER JOIN categorias c
      ON c.id = p.categoria_id

    WHERE s.ubicacion_id = $1

    ORDER BY
      p.nombre ASC
    `,
    [ubicacionId],
  );

  return result.rows;
}