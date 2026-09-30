import { z } from "zod";
import type { SnailPayStatusDetail } from "../types/snailpay";

export const MAX_AMOUNT = 50_000;

export const chargeRequestSchema = z.object({
  card_number: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{16}$/)),
  expiration_date: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvv: z.string().regex(/^\d{3,4}$/),
  cardholder_name: z.string().trim().min(1),
  amount: z
    .number()
    .positive()
    .max(MAX_AMOUNT)
    .refine((value) => Math.round(value * 100) / 100 === value, "Máximo 2 decimales"),
  payer_id: z.string().trim().min(1),
  payer_email: z.email(),
});

export type ChargeRequest = z.infer<typeof chargeRequestSchema>;

export const invalidDetailByField: Record<string, SnailPayStatusDetail> = {
  card_number: "invalid_card_number",
  expiration_date: "invalid_expiration_date",
  cvv: "invalid_security_code",
  cardholder_name: "invalid_cardholder_name",
  amount: "invalid_amount",
  payer_id: "invalid_payer",
  payer_email: "invalid_payer",
};