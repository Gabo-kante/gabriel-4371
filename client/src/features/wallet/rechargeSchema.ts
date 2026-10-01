import { z } from "zod";

export const MAX_RECHARGE = 50_000;

export const rechargeFormSchema = z.object({
  cardholderName: z.string().trim().min(1, "Escribe el nombre que aparece en la tarjeta"),
  cardNumber: z
    .string()
    .refine((value) => /^\d{16}$/.test(value.replace(/[\s-]/g, "")), "El número de tarjeta debe tener 16 dígitos"),
  expirationDate: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Usa el formato MM/AA, por ejemplo 12/26"),
  cvv: z.string().regex(/^\d{3,4}$/, "El CVV debe tener 3 o 4 dígitos"),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Escribe un monto válido, con máximo 2 decimales")
    .refine((value) => Number(value) > 0, "El monto debe ser mayor que cero")
    .refine((value) => Number(value) <= MAX_RECHARGE, "El monto máximo por recarga es $50,000"),
});

export type RechargeFormValues = z.infer<typeof rechargeFormSchema>;