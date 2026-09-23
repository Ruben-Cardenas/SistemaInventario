import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

interface CrearProductoData {
  sku: string;
  nombre: string;
  categoria_id: number;
  precio: number;
}

interface ActualizarProductoData {
  sku?: string;
  nombre?: string;
  categoria_id?: number;
  precio?: number;
}

export async function obtenerProductos(
  usuario: AuthPayload,
  filtros: {
    search?: string;
    categoria?: string;
    estado?: string;
  },
) {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  if (filtros.search) {
    parametros.push(`%${filtros.search}%`);

    condiciones.push(`
      (
        p.nombre ILIKE $${parametros.length}
        OR p.sku ILIKE $${parametros.length}
      )
    `);
  }

  if (
    filtros.categoria &&
    filtros.categoria !== "Todas"
  ) {
    parametros.push(filtros.categoria);

    condiciones.push(`
      c.nombre = $${parametros.length}
    `);
  }

  if (filtros.estado) {
    parametros.push(filtros.estado);

    condiciones.push(`
      p.estado = $${parametros.length}
    `);
  }

  const esAdmin = usuario.rol === "admin";

  if (!esAdmin) {
    if (!usuario.ubicacion_id) {
      throw new Error(
        "El usuario encargado no tiene una ubicación asignada",
      );
    }

    parametros.push(usuario.ubicacion_id);

    condiciones.push(`
      s.ubicacion_id = $${parametros.length}
    `);
  }

  const where =
    condiciones.length > 0
      ? `WHERE ${condiciones.join(" AND ")}`
      : "";

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.sku,
      p.nombre,
      c.nombre AS categoria,
      p.precio,
      p.estado,
      COALESCE(SUM(s.cantidad), 0)::int AS stock,
      p.fecha_creacion,
      p.fecha_actualizacion
    FROM productos p
    INNER JOIN categorias c
      ON c.id = p.categoria_id
    LEFT JOIN stock s
      ON s.producto_id = p.id
    ${where}
    GROUP BY
      p.id,
      p.sku,
      p.nombre,
      c.nombre,
      p.precio,
      p.estado,
      p.fecha_creacion,
      p.fecha_actualizacion
    ORDER BY p.id DESC
    `,
    parametros,
  );

  return result.rows;
}

export async function obtenerInventario(
  usuario: AuthPayload,
) {
  const parametros: unknown[] = [];

  let filtroUbicacion = "";

  if (usuario.rol !== "admin") {
    if (!usuario.ubicacion_id) {
      throw new Error(
        "El usuario encargado no tiene una ubicación asignada",
      );
    }

    parametros.push(usuario.ubicacion_id);

    filtroUbicacion = `
      AND ubicacion_id = $1
    `;
  }

  const result = await pool.query(
    `
    SELECT
      sku,
      producto,
      categoria,
      ubicacion,
      cantidad::int AS stock,
      stock_minimo::int AS minimo,
      precio,
      estado,
      stock_bajo
    FROM vista_inventario
    WHERE estado = 'activo'
    ${filtroUbicacion}
    ORDER BY
      ubicacion ASC,
      producto ASC
    `,
    parametros,
  );

  return result.rows;
}

export async function obtenerProductoPorId(
  id: number,
  usuario: AuthPayload,
) {
  const parametros: unknown[] = [id];

  let filtroUbicacion = "";

  if (usuario.rol !== "admin") {
    if (!usuario.ubicacion_id) {
      throw new Error(
        "El usuario encargado no tiene una ubicación asignada",
      );
    }

    parametros.push(usuario.ubicacion_id);

    filtroUbicacion = `
      AND s.ubicacion_id = $${parametros.length}
    `;
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.sku,
      p.nombre,
      c.nombre AS categoria,
      p.categoria_id,
      p.precio,
      p.estado,
      COALESCE(SUM(s.cantidad), 0)::int AS stock,
      p.fecha_creacion,
      p.fecha_actualizacion
    FROM productos p
    INNER JOIN categorias c
      ON c.id = p.categoria_id
    LEFT JOIN stock s
      ON s.producto_id = p.id
    WHERE p.id = $1
    ${filtroUbicacion}
    GROUP BY
      p.id,
      p.sku,
      p.nombre,
      c.nombre,
      p.categoria_id,
      p.precio,
      p.estado,
      p.fecha_creacion,
      p.fecha_actualizacion
    `,
    parametros,
  );

  return result.rows[0] ?? null;
}

export async function crearProducto(
  datos: CrearProductoData,
) {
  const categoriaResult = await pool.query(
    `
    SELECT id
    FROM categorias
    WHERE id = $1
      AND activa = true
    `,
    [datos.categoria_id],
  );

  if (categoriaResult.rowCount === 0) {
    throw new Error(
      "La categoría no existe o está inactiva",
    );
  }

  const existente = await pool.query(
    `
    SELECT id
    FROM productos
    WHERE sku = $1
    `,
    [datos.sku],
  );

  if (
    existente.rowCount &&
    existente.rowCount > 0
  ) {
    throw new Error(
      "Ya existe un producto con ese SKU",
    );
  }

  const result = await pool.query(
    `
    INSERT INTO productos (
      sku,
      nombre,
      categoria_id,
      precio,
      estado
    )
    VALUES ($1, $2, $3, $4, 'activo')
    RETURNING
      id,
      sku,
      nombre,
      categoria_id,
      precio,
      estado,
      fecha_creacion,
      fecha_actualizacion
    `,
    [
      datos.sku,
      datos.nombre,
      datos.categoria_id,
      datos.precio,
    ],
  );

  const producto = result.rows[0];

  await pool.query(
    `
    INSERT INTO stock (
      producto_id,
      ubicacion_id,
      cantidad,
      stock_minimo
    )
    SELECT
      $1,
      id,
      0,
      5
    FROM ubicaciones
    WHERE activa = true
    ON CONFLICT (
      producto_id,
      ubicacion_id
    )
    DO NOTHING
    `,
    [producto.id],
  );

  return producto;
}

export async function actualizarProducto(
  id: number,
  datos: ActualizarProductoData,
) {
  const campos: string[] = [];
  const parametros: unknown[] = [];

  if (datos.sku !== undefined) {
    parametros.push(datos.sku);

    campos.push(
      `sku = $${parametros.length}`,
    );
  }

  if (datos.nombre !== undefined) {
    parametros.push(datos.nombre);

    campos.push(
      `nombre = $${parametros.length}`,
    );
  }

  if (datos.categoria_id !== undefined) {
    const categoriaResult =
      await pool.query(
        `
        SELECT id
        FROM categorias
        WHERE id = $1
          AND activa = true
        `,
        [datos.categoria_id],
      );

    if (categoriaResult.rowCount === 0) {
      throw new Error(
        "La categoría no existe o está inactiva",
      );
    }

    parametros.push(datos.categoria_id);

    campos.push(
      `categoria_id = $${parametros.length}`,
    );
  }

  if (datos.precio !== undefined) {
    parametros.push(datos.precio);

    campos.push(
      `precio = $${parametros.length}`,
    );
  }

  if (campos.length === 0) {
    throw new Error(
      "No se proporcionaron datos para actualizar",
    );
  }

  parametros.push(id);

  const result = await pool.query(
    `
    UPDATE productos
    SET
      ${campos.join(", ")},
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $${parametros.length}
    RETURNING
      id,
      sku,
      nombre,
      categoria_id,
      precio,
      estado,
      fecha_creacion,
      fecha_actualizacion
    `,
    parametros,
  );

  return result.rows[0] ?? null;
}

export async function cambiarEstadoProducto(
  id: number,
  estado: "activo" | "descontinuado",
) {
  const result = await pool.query(
    `
    UPDATE productos
    SET
      estado = $1,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      sku,
      nombre,
      categoria_id,
      precio,
      estado,
      fecha_actualizacion
    `,
    [estado, id],
  );

  return result.rows[0] ?? null;
}

export async function obtenerCategorias() {
  const result = await pool.query(
    `
    SELECT
      id,
      nombre,
      descripcion
    FROM categorias
    WHERE activa = true
    ORDER BY nombre ASC
    `,
  );

  return result.rows;
}