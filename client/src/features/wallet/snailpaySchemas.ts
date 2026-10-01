import { z } from "zod";

export const snailPayResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected", "error"]),
  status_detail: z.string(),
  transaction_amount: z.number().nullable(),
  date_created: z.string(),
  authorization_code: z.string().nullable(),
  reference: z.string(),
  payer_id: z.string().nullable(),
  payer_email: z.string().nullable(),
  card_number: z.string().nullable(),
  cvv: z.string().nullable(),
});

export type SnailPayResponse = z.infer<typeof snailPayResponseSchema>;