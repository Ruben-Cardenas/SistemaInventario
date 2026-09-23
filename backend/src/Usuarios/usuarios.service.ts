import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";

export async function obtenerUsuarios() {
  const result = await pool.query(`
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.rol,
      u.ubicacion_id,
      COALESCE(ub.nombre, 'Todas las ubicaciones') AS ubicacion,
      u.activo,
      u.fecha_creacion
    FROM usuarios u
    LEFT JOIN ubicaciones ub
      ON ub.id = u.ubicacion_id
    ORDER BY
      CASE
        WHEN u.rol = 'admin' THEN 1
        WHEN u.rol = 'encargado' THEN 2
        ELSE 3
      END,
      u.id ASC
  `);

  return result.rows.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol:
      usuario.rol === "admin"
        ? "Administrador"
        : "Encargado",
    ubicacion: usuario.ubicacion,
    estado: usuario.activo
      ? "Activo"
      : "Inactivo",
    ubicacion_id: usuario.ubicacion_id,
    activo: usuario.activo,
    fecha_creacion: usuario.fecha_creacion,
  }));
}

export async function cambiarEstadoUsuario(
  usuarioActual: AuthPayload,
  usuarioId: number,
  activo: boolean,
) {
  if (usuarioActual.rol !== "admin") {
    throw new Error(
      "Solo el administrador puede activar o desactivar usuarios",
    );
  }

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new Error("El ID del usuario no es válido");
  }

  if (usuarioActual.id === usuarioId && !activo) {
    throw new Error(
      "El administrador no puede desactivar su propia cuenta",
    );
  }

  const usuarioResult = await pool.query(
    `
    SELECT
      id,
      nombre,
      email,
      rol,
      activo
    FROM usuarios
    WHERE id = $1
    `,
    [usuarioId],
  );

  if (usuarioResult.rows.length === 0) {
    throw new Error("El usuario no existe");
  }

  const usuario = usuarioResult.rows[0];

  if (usuario.rol === "admin") {
    throw new Error(
      "La cuenta del administrador no puede ser desactivada",
    );
  }

  const result = await pool.query(
    `
    UPDATE usuarios
    SET activo = $1
    WHERE id = $2
    RETURNING
      id,
      nombre,
      email,
      rol,
      activo
    `,
    [activo, usuarioId],
  );

  return result.rows[0];
}

export async function cambiarPasswordUsuario(
  usuarioActual: AuthPayload,
  usuarioId: number,
  nuevaPassword: string,
) {
  if (usuarioActual.rol !== "admin") {
    throw new Error(
      "Solo el administrador puede cambiar contraseñas",
    );
  }

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new Error("El ID del usuario no es válido");
  }

  if (!nuevaPassword || nuevaPassword.length < 8) {
    throw new Error(
      "La contraseña debe tener al menos 8 caracteres",
    );
  }

  const usuarioResult = await pool.query(
    `
    SELECT
      id,
      nombre,
      email,
      rol,
      activo
    FROM usuarios
    WHERE id = $1
    `,
    [usuarioId],
  );

  if (usuarioResult.rows.length === 0) {
    throw new Error("El usuario no existe");
  }

  const usuario = usuarioResult.rows[0];

  if (usuario.rol === "admin") {
    throw new Error(
      "La contraseña del administrador no puede modificarse desde este módulo",
    );
  }

  const passwordHash = await bcrypt.hash(
    nuevaPassword,
    12,
  );

  const result = await pool.query(
    `
    UPDATE usuarios
    SET password_hash = $1
    WHERE id = $2
    RETURNING
      id,
      nombre,
      email,
      rol,
      activo
    `,
    [passwordHash, usuarioId],
  );

  return result.rows[0];
}