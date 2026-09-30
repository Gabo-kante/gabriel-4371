import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Escribe tu nombre completo")
      .max(80, "El nombre es demasiado largo"),
    email: z.string().trim().pipe(z.email("Correo electrónico inválido")),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
      .regex(/\d/, "Debe incluir al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("Correo electrónico inválido")),
  password: z.string().min(1, "Escribe tu contraseña"),
});

// Lo que realmente se guarda en localStorage (nunca la contraseña en claro)
export const storedUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  salt: z.string(),
  iterations: z.number().int().positive(),
  createdAt: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StoredUser = z.infer<typeof storedUserSchema>;
export type SessionUser = Pick<StoredUser, "id" | "fullName" | "email">;