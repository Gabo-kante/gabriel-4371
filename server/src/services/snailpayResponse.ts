import { randomBytes, randomUUID } from "node:crypto";
import type { SnailPayResponse, SnailPayStatus, SnailPayStatusDetail } from "../types/snailpay";

export interface Echo {
  amount: number | null;
  payerId: string | null;
  payerEmail: string | null;
  cardNumber: string | null;
  cvv: string | null;
}

export function extractEcho(body: unknown): Echo {
  const data = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const text = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    amount: typeof data.amount === "number" && Number.isFinite(data.amount) ? data.amount : null,
    payerId: text(data.payer_id),
    payerEmail: text(data.payer_email),
    cardNumber: text(data.card_number),
    cvv: text(data.cvv),
  };
}

interface BuildParams {
  status: SnailPayStatus;
  statusDetail: SnailPayStatusDetail;
  echo: Echo;
  authorizationCode?: string | null;
  now?: Date;
}

export function buildResponse({
  status,
  statusDetail,
  echo,
  authorizationCode = null,
  now = new Date(),
}: BuildParams): SnailPayResponse {
  return {
    id: `snp_${randomUUID()}`,
    status,
    status_detail: statusDetail,
    transaction_amount: echo.amount,
    date_created: now.toISOString(),
    authorization_code: authorizationCode,
    reference: `SP-${randomBytes(5).toString("hex").toUpperCase()}`,
    payer_id: echo.payerId,
    payer_email: echo.payerEmail,
    card_number: echo.cardNumber,
    cvv: echo.cvv,
  };
}