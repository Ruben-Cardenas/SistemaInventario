import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

interface UsuarioBD {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "admin" | "encargado";
  ubicacion_id: number | null;
  ubicacion_nombre: string | null;
  activo: boolean;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "encargado";
  ubicacion_id: number | null;
  ubicacion_nombre: string | null;
}

export async function login(
  email: string,
  password: string,
): Promise<{
  usuario: UsuarioAutenticado;
  token: string;
}> {
  const result = await pool.query<UsuarioBD>(
    `
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.password_hash,
      u.rol,
      u.ubicacion_id,
      ub.nombre AS ubicacion_nombre,
      u.activo
    FROM usuarios u
    LEFT JOIN ubicaciones ub
      ON ub.id = u.ubicacion_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("Credenciales inválidas");
  }

  const usuario = result.rows[0];

  if (!usuario.activo) {
    throw new Error("El usuario está desactivado");
  }

  const passwordCorrecta = await bcrypt.compare(
    password,
    usuario.password_hash,
  );

  if (!passwordCorrecta) {
    throw new Error("Credenciales inválidas");
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no está configurado");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      ubicacion_id: usuario.ubicacion_id,
    },
    secret,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"],
    },
  );

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      ubicacion_id: usuario.ubicacion_id,
      ubicacion_nombre: usuario.ubicacion_nombre,
    },
    token,
  };
}