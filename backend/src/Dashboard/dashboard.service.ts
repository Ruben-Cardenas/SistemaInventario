import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

export async function obtenerDashboard(usuario: AuthPayload) {
  const esAdmin = usuario.rol === "admin";
  const ubicacionId = usuario.ubicacion_id;

  const filtroUbicacion = esAdmin
    ? ""
    : "AND s.ubicacion_id = $1";

  const parametros = esAdmin ? [] : [ubicacionId];

  const productosResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM productos
    WHERE estado = 'activo'
    `,
  );

  const stockResult = await pool.query(
    `
    SELECT COALESCE(SUM(s.cantidad), 0)::int AS total
    FROM stock s
    INNER JOIN productos p
      ON p.id = s.producto_id
    WHERE p.estado = 'activo'
    ${filtroUbicacion}
    `,
    parametros,
  );

  const stockBajoResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM stock s
    INNER JOIN productos p
      ON p.id = s.producto_id
    WHERE p.estado = 'activo'
      AND s.cantidad < s.stock_minimo
      ${filtroUbicacion}
    `,
    parametros,
  );

  const movimientosResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM movimientos m
    WHERE
      $1 = true
      OR m.origen_id = $2
      OR m.destino_id = $2
    `,
    [esAdmin, ubicacionId],
  );

  const ubicacionesResult = await pool.query(
    `
    SELECT
      u.id,
      u.nombre,
      COALESCE(SUM(s.cantidad), 0)::int AS cantidad,
      CASE
        WHEN u.nombre = 'Matriz' THEN 'Almacén principal'
        ELSE 'Sucursal'
      END AS descripcion
    FROM ubicaciones u
    LEFT JOIN stock s
      ON s.ubicacion_id = u.id
    LEFT JOIN productos p
      ON p.id = s.producto_id
      AND p.estado = 'activo'
    WHERE u.activa = true
      ${
        esAdmin
          ? ""
          : "AND u.id = $1"
      }
    GROUP BY u.id, u.nombre
    ORDER BY u.id
    `,
    esAdmin ? [] : [ubicacionId],
  );

  const stockBajoProductosResult = await pool.query(
    `
    SELECT
      p.id,
      p.sku,
      p.nombre AS producto,
      c.nombre AS categoria,
      u.nombre AS ubicacion,
      s.cantidad AS stock,
      s.stock_minimo AS minimo,
      p.precio
    FROM stock s
    INNER JOIN productos p
      ON p.id = s.producto_id
    INNER JOIN categorias c
      ON c.id = p.categoria_id
    INNER JOIN ubicaciones u
      ON u.id = s.ubicacion_id
    WHERE p.estado = 'activo'
      AND s.cantidad < s.stock_minimo
      ${filtroUbicacion}
    ORDER BY s.cantidad ASC
    LIMIT 10
    `,
    parametros,
  );

  const movimientosRecientesResult = await pool.query(
    `
    SELECT
      m.id,
      m.folio,
      m.tipo,
      origen.nombre AS origen,
      destino.nombre AS destino,
      m.fecha,
      m.total,
      COALESCE(SUM(md.cantidad), 0)::int AS cantidad
    FROM movimientos m
    LEFT JOIN ubicaciones origen
      ON origen.id = m.origen_id
    LEFT JOIN ubicaciones destino
      ON destino.id = m.destino_id
    LEFT JOIN movimiento_detalle md
      ON md.movimiento_id = m.id
    WHERE
      $1 = true
      OR m.origen_id = $2
      OR m.destino_id = $2
    GROUP BY
      m.id,
      m.folio,
      m.tipo,
      origen.nombre,
      destino.nombre,
      m.fecha,
      m.total
    ORDER BY m.fecha DESC
    LIMIT 5
    `,
    [esAdmin, ubicacionId],
  );

  const graficaResult = await pool.query(
    `
    SELECT
      TO_CHAR(DATE_TRUNC('month', m.fecha), 'Mon') AS mes,
      EXTRACT(MONTH FROM m.fecha)::int AS numero_mes,
      m.tipo,
      COALESCE(SUM(md.cantidad), 0)::int AS cantidad
    FROM movimientos m
    INNER JOIN movimiento_detalle md
      ON md.movimiento_id = m.id
    WHERE
      m.fecha >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      AND (
        $1 = true
        OR m.origen_id = $2
        OR m.destino_id = $2
      )
    GROUP BY
      DATE_TRUNC('month', m.fecha),
      TO_CHAR(DATE_TRUNC('month', m.fecha), 'Mon'),
      EXTRACT(MONTH FROM m.fecha),
      m.tipo
    ORDER BY DATE_TRUNC('month', m.fecha)
    `,
    [esAdmin, ubicacionId],
  );

  return {
    resumen: {
      totalProductos: productosResult.rows[0].total,
      stockTotal: stockResult.rows[0].total,
      stockBajo: stockBajoResult.rows[0].total,
      movimientos: movimientosResult.rows[0].total,
    },

    inventarioPorUbicacion: ubicacionesResult.rows,

    stockBajoProductos: stockBajoProductosResult.rows,

    movimientosRecientes: movimientosRecientesResult.rows,

    graficaMovimientos: graficaResult.rows,
  };
}