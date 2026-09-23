import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

const passwordSchema = z.object({
  nuevaPassword: z
    .string()
    .min(8)
    .max(100),
});

test("acepta una contraseña válida", () => {
  const resultado = passwordSchema.safeParse({
    nuevaPassword: "Admin123!",
  });

  assert.equal(resultado.success, true);
});

test("rechaza una contraseña menor de 8 caracteres", () => {
  const resultado = passwordSchema.safeParse({
    nuevaPassword: "1234567",
  });

  assert.equal(resultado.success, false);
});

test("acepta una contraseña de exactamente 8 caracteres", () => {
  const resultado = passwordSchema.safeParse({
    nuevaPassword: "12345678",
  });

  assert.equal(resultado.success, true);
});

test("rechaza una contraseña de más de 100 caracteres", () => {
  const resultado = passwordSchema.safeParse({
    nuevaPassword: "a".repeat(101),
  });

  assert.equal(resultado.success, false);
});

test("rechaza el campo cuando no se llama nuevaPassword", () => {
  const resultado = passwordSchema.safeParse({
    password: "Admin123!",
  });

  assert.equal(resultado.success, false);
});