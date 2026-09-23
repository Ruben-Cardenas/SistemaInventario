import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  id: number;
  email: string;
  rol: "admin" | "encargado";
  ubicacion_id: number | null;
}

export interface AuthRequest extends Request {
  usuario?: AuthPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
      });

      return;
    }

    if (!authorization.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Formato de token inválido",
      });

      return;
    }

    const token = authorization.substring(7);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET no está configurado",
      });

      return;
    }

    const payload = jwt.verify(token, secret) as AuthPayload;

    req.usuario = payload;

    next();
  } catch (error) {
    console.error("Error de autenticación:", error);

    res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}

export function requireRole(
  ...roles: Array<"admin" | "encargado">
) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.usuario) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });

      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
      });

      return;
    }

    next();
  };
}