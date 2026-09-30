import { randomInt } from "node:crypto";
import type { SnailPayResponse, SnailPayStatusDetail } from "../types/snailpay";
import { buildResponse, extractEcho } from "./snailpayResponse";
import { ChargeRequest, chargeRequestSchema, invalidDetailByField } from "../schemas/chargerRequest";

export const SUCCESS_CARD = { number: "1234123412341234", expiration: "12/26", cvv: "543" } as const;
export const DECLINED_CARD = "4000000000000002";
export const INSUFFICIENT_FUNDS_CARD = "4000000000009995";

export interface ChargeResult {
  httpStatus: number;
  body: SnailPayResponse;
}

function isExpired(expiration: string, now: Date): boolean {
  const [month, year] = expiration.split("/").map(Number);
  const fullYear = 2000 + year;
  const currentYear = now.getFullYear();
  return fullYear < currentYear || (fullYear === currentYear && month < now.getMonth() + 1);
}

function evaluateCard(charge: ChargeRequest, now: Date): SnailPayStatusDetail {
  if (charge.card_number === SUCCESS_CARD.number) {
    if (charge.expiration_date !== SUCCESS_CARD.expiration) return "bad_expiration_date";
    if (charge.cvv !== SUCCESS_CARD.cvv) return "bad_security_code";
    return "accredited";
  }
  if (isExpired(charge.expiration_date, now)) return "expired_card";
  if (charge.card_number === INSUFFICIENT_FUNDS_CARD) return "insufficient_funds";
  return "card_declined"; // incluye DECLINED_CARD y cualquier otra tarjeta bien formada
}

export function processCharge(rawBody: unknown, now = new Date()): ChargeResult {
  const echo = extractEcho(rawBody);
  const reject = (httpStatus: number, statusDetail: SnailPayStatusDetail): ChargeResult => ({
    httpStatus,
    body: buildResponse({ status: "rejected", statusDetail, echo, now }),
  });

  const parsed = chargeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return reject(400, invalidDetailByField[field] ?? "invalid_request");
  }

  const outcome = evaluateCard(parsed.data, now);
  if (outcome !== "accredited") return reject(402, outcome);

  return {
    httpStatus: 201,
    body: buildResponse({
      status: "approved",
      statusDetail: "accredited",
      echo,
      authorizationCode: String(randomInt(100_000, 1_000_000)),
      now,
    }),
  };
}