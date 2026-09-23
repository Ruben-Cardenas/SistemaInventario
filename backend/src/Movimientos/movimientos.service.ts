import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

interface MovimientoDetalleData {
  producto_id: number;
  cantidad: number;
  precio_unitario?: number;
}

interface CrearMovimientoData {
  tipo:
    | "entrada_proveedor"
    | "traslado_sucursal";
  origen_id?: number | null;
  destino_id?: number | null;
  detalles: MovimientoDetalleData[];
  observaciones?: string;
}

export async function obtenerMovimientos(
  usuario: AuthPayload,
) {
  const esAdmin = usuario.rol === "admin";

  const parametros: unknown[] = [];
  let filtroUbicacion = "";

  if (!esAdmin) {
    if (!usuario.ubicacion_id) {
      throw new Error(
        "El usuario encargado no tiene una ubicación asignada",
      );
    }

    parametros.push(usuario.ubicacion_id);

    filtroUbicacion = `
      AND (
        m.origen_id = $1
        OR m.destino_id = $1
      )
    `;
  }

  const result = await pool.query(
    `
    SELECT
      m.id,
      m.folio,

      CASE
        WHEN m.tipo = 'entrada_proveedor'
          THEN 'Entrada de proveedor'

        WHEN m.tipo = 'traslado_sucursal'
          THEN 'Traslado a sucursal'

        ELSE m.tipo::text
      END AS tipo,

      COALESCE(
        origen.nombre,
        'Proveedor'
      ) AS origen,

      COALESCE(
        destino.nombre,
        'Sin destino'
      ) AS destino,

      u.nombre AS usuario,

      COALESCE(
        SUM(md.cantidad),
        0
      )::int AS productos,

      m.total,
      m.fecha,
      m.observaciones

    FROM movimientos m

    LEFT JOIN ubicaciones origen
      ON origen.id = m.origen_id

    LEFT JOIN ubicaciones destino
      ON destino.id = m.destino_id

    INNER JOIN usuarios u
      ON u.id = m.usuario_id

    LEFT JOIN movimiento_detalle md
      ON md.movimiento_id = m.id

    WHERE 1 = 1
      ${filtroUbicacion}

    GROUP BY
      m.id,
      m.folio,
      m.tipo,
      origen.nombre,
      destino.nombre,
      u.nombre,
      m.total,
      m.fecha,
      m.observaciones

    ORDER BY m.fecha DESC
    `,
    parametros,
  );

  return result.rows;
}

export async function crearMovimiento(
  usuario: AuthPayload,
  datos: CrearMovimientoData,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Bloqueamos la generación del folio para evitar
     * folios duplicados cuando existen varias peticiones
     * al mismo tiempo.
     */
    await client.query(
      "SELECT pg_advisory_xact_lock(987654321)",
    );

    /*
     * Validaciones generales
     */
    if (!datos.detalles || datos.detalles.length === 0) {
      throw new Error(
        "El movimiento debe contener al menos un producto",
      );
    }

    /*
     * Las entradas de proveedor solamente las puede
     * registrar un administrador.
     */
    if (
      datos.tipo === "entrada_proveedor" &&
      usuario.rol !== "admin"
    ) {
      throw new Error(
        "Solo un administrador puede registrar entradas de proveedor",
      );
    }

    /*
     * Buscar Matriz.
     */
    const matrizResult = await client.query(
      `
      SELECT id
      FROM ubicaciones
      WHERE nombre = 'Matriz'
        AND activa = true
      LIMIT 1
      `,
    );

    if (matrizResult.rowCount === 0) {
      throw new Error(
        "No se encontró la ubicación Matriz",
      );
    }

    const matrizId = matrizResult.rows[0].id;

    let origenId: number | null = null;
    let destinoId: number | null = null;

    /*
     * ENTRADA DE PROVEEDOR
     *
     * Proveedor → Matriz
     */
    if (datos.tipo === "entrada_proveedor") {
      origenId = null;
      destinoId = matrizId;
    }

    /*
     * TRASLADO A SUCURSAL
     *
     * Matriz → Saucos
     * Matriz → 450
     */
    if (
      datos.tipo === "traslado_sucursal"
    ) {
      origenId = matrizId;

      if (!datos.destino_id) {
        throw new Error(
          "El destino es obligatorio para un traslado",
        );
      }

      destinoId = datos.destino_id;

      /*
       * Verificar que el destino exista.
       */
      const destinoResult = await client.query(
        `
        SELECT
          id,
          nombre
        FROM ubicaciones
        WHERE id = $1
          AND activa = true
        LIMIT 1
        `,
        [destinoId],
      );

      if (destinoResult.rowCount === 0) {
        throw new Error(
          "La ubicación destino no existe o está inactiva",
        );
      }

      /*
       * No se permiten movimientos a la misma ubicación.
       */
      if (destinoId === origenId) {
        throw new Error(
          "El origen y destino no pueden ser iguales",
        );
      }

      /*
       * Solo se permiten traslados a Saucos o 450.
       */
      const nombreDestino =
        destinoResult.rows[0].nombre;

      if (
        nombreDestino !== "Saucos" &&
        nombreDestino !== "450"
      ) {
        throw new Error(
          "Los traslados solamente pueden realizarse hacia Saucos o 450",
        );
      }

      /*
       * Un encargado solamente puede trasladar
       * mercancía hacia su propia sucursal.
       */
      if (usuario.rol !== "admin") {
        if (
          usuario.ubicacion_id !== destinoId
        ) {
          throw new Error(
            "No tienes permiso para realizar movimientos hacia esta sucursal",
          );
        }
      }
    }

    /*
     * Verificar que los productos existan y estén activos.
     */
    const productosIds = datos.detalles.map(
      (detalle) => detalle.producto_id,
    );

    const productosResult = await client.query(
      `
      SELECT
        id,
        sku,
        nombre,
        precio,
        estado
      FROM productos
      WHERE id = ANY($1::int[])
        AND estado = 'activo'
      `,
      [productosIds],
    );

    if (
      productosResult.rows.length !==
      productosIds.length
    ) {
      throw new Error(
        "Uno o más productos no existen o están descontinuados",
      );
    }

    /*
     * Crear un mapa para consultar rápidamente
     * la información de cada producto.
     */
    const productosMap = new Map<
      number,
      {
        id: number;
        sku: string;
        nombre: string;
        precio: number;
      }
    >();

    for (const producto of productosResult.rows) {
      productosMap.set(producto.id, {
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        precio: Number(producto.precio),
      });
    }

    /*
     * Verificar cantidades y calcular el total.
     */
    let total = 0;

    const detallesProcesados = datos.detalles.map(
      (detalle) => {
        if (
          !Number.isInteger(detalle.cantidad) ||
          detalle.cantidad <= 0
        ) {
          throw new Error(
            "La cantidad de cada producto debe ser un número entero mayor que 0",
          );
        }

        const producto = productosMap.get(
          detalle.producto_id,
        );

        if (!producto) {
          throw new Error(
            `No se encontró el producto ${detalle.producto_id}`,
          );
        }

        const precioUnitario =
          detalle.precio_unitario !== undefined
            ? detalle.precio_unitario
            : producto.precio;

        if (
          !Number.isFinite(precioUnitario) ||
          precioUnitario < 0
        ) {
          throw new Error(
            `El precio del producto ${producto.nombre} no es válido`,
          );
        }

        const subtotal =
          detalle.cantidad * precioUnitario;

        total += subtotal;

        return {
          ...detalle,
          precio_unitario: precioUnitario,
          subtotal,
          producto,
        };
      },
    );

    /*
     * Para traslados verificamos y bloqueamos
     * el stock de Matriz antes de modificarlo.
     */
    if (
      datos.tipo === "traslado_sucursal"
    ) {
      for (const detalle of detallesProcesados) {
        const stockResult =
          await client.query(
            `
            SELECT
              cantidad
            FROM stock
            WHERE producto_id = $1
              AND ubicacion_id = $2
            FOR UPDATE
            `,
            [
              detalle.producto_id,
              matrizId,
            ],
          );

        if (stockResult.rowCount === 0) {
          throw new Error(
            `No existe stock para el producto ${detalle.producto.nombre} en Matriz`,
          );
        }

        const stockActual = Number(
          stockResult.rows[0].cantidad,
        );

        if (
          stockActual < detalle.cantidad
        ) {
          throw new Error(
            `Stock insuficiente para ${detalle.producto.nombre}. Disponible: ${stockActual}, solicitado: ${detalle.cantidad}`,
          );
        }
      }
    }

    /*
     * Verificar que exista el registro de stock
     * de cada producto en el destino.
     */
    for (const detalle of detallesProcesados) {
      const stockDestinoResult =
        await client.query(
          `
          SELECT
            cantidad
          FROM stock
          WHERE producto_id = $1
            AND ubicacion_id = $2
          FOR UPDATE
          `,
          [
            detalle.producto_id,
            destinoId,
          ],
        );

      if (
        stockDestinoResult.rowCount === 0
      ) {
        throw new Error(
          `No existe un registro de stock para ${detalle.producto.nombre} en la ubicación destino`,
        );
      }
    }

    /*
     * Generar siguiente folio.
     */
    const folioResult = await client.query(
      `
      SELECT
        COALESCE(
          MAX(
            CAST(
              SUBSTRING(folio FROM 5) AS BIGINT
            )
          ),
          0
        ) + 1 AS siguiente
      FROM movimientos
      `,
    );

    const siguienteFolio = Number(
      folioResult.rows[0].siguiente,
    );

    const folio = `MOV-${String(
      siguienteFolio,
    ).padStart(5, "0")}`;

    /*
     * Crear encabezado del movimiento.
     */
    const movimientoResult =
      await client.query(
        `
        INSERT INTO movimientos (
          folio,
          tipo,
          origen_id,
          destino_id,
          usuario_id,
          total,
          observaciones
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          id,
          folio,
          tipo,
          origen_id,
          destino_id,
          usuario_id,
          total,
          fecha,
          observaciones
        `,
        [
          folio,
          datos.tipo,
          origenId,
          destinoId,
          usuario.id,
          total,
          datos.observaciones ??
            null,
        ],
      );

    const movimiento =
      movimientoResult.rows[0];

    /*
     * Crear los detalles y actualizar el stock.
     */
    for (const detalle of detallesProcesados) {
      await client.query(
        `
        INSERT INTO movimiento_detalle (
          movimiento_id,
          producto_id,
          cantidad,
          precio_unitario
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          movimiento.id,
          detalle.producto_id,
          detalle.cantidad,
          detalle.precio_unitario,
        ],
      );

      /*
       * ENTRADA:
       * Aumentar stock de Matriz.
       */
      if (
        datos.tipo ===
        "entrada_proveedor"
      ) {
        await client.query(
          `
          UPDATE stock
          SET cantidad = cantidad + $1
          WHERE producto_id = $2
            AND ubicacion_id = $3
          `,
          [
            detalle.cantidad,
            detalle.producto_id,
            matrizId,
          ],
        );
      }

      /*
       * TRASLADO:
       * Restar de Matriz.
       */
      if (
        datos.tipo ===
        "traslado_sucursal"
      ) {
        await client.query(
          `
          UPDATE stock
          SET cantidad = cantidad - $1
          WHERE producto_id = $2
            AND ubicacion_id = $3
          `,
          [
            detalle.cantidad,
            detalle.producto_id,
            matrizId,
          ],
        );

        /*
         * TRASLADO:
         * Aumentar en la sucursal.
         */
        await client.query(
          `
          UPDATE stock
          SET cantidad = cantidad + $1
          WHERE producto_id = $2
            AND ubicacion_id = $3
          `,
          [
            detalle.cantidad,
            detalle.producto_id,
            destinoId,
          ],
        );
      }
    }

    await client.query("COMMIT");

    return {
      ...movimiento,
      folio,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}