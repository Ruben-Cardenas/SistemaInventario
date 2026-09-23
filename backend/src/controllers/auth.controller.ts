import type { Request, Response } from "express";
import { z } from "zod";
import { login } from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const resultado = await login(data.email, data.password);

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: resultado,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos de inicio de sesión inválidos",
        errors: error.issues,
      });

      return;
    }

    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}