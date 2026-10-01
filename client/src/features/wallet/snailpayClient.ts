import { snailPayResponseSchema, type SnailPayResponse } from "./snailpaySchemas";

export interface ChargeRequest {
  card_number: string;
  expiration_date: string;
  cvv: string;
  cardholder_name: string;
  amount: number;
  payer_id: string;
  payer_email: string;
}

export type ChargeOutcome =
  | { kind: "approved"; response: SnailPayResponse }
  | { kind: "rejected"; response: SnailPayResponse; message: string }
  | { kind: "unavailable"; message: string; response?: SnailPayResponse }
  | { kind: "timeout"; message: string }
  | { kind: "network"; message: string };

export interface ChargeOptions {
  timeoutMs?: number;
  /** Envía X-Simulate-Outage para demostrar la caída de SnailPay. */
  simulateOutage?: boolean;
}

const ENDPOINT = "/api/snailpay/charges";
export const DEFAULT_TIMEOUT_MS = 8_000;

const REJECTED_MESSAGES: Record<string, string> = {
  invalid_request: "La solicitud no es válida. Revisa los datos e inténtalo de nuevo.",
  invalid_card_number: "El número de tarjeta no es válido. Debe tener 16 dígitos.",
  invalid_expiration_date: "La fecha de vencimiento no es válida. Usa el formato MM/AA.",
  invalid_security_code: "El CVV no es válido. Debe tener 3 o 4 dígitos.",
  invalid_cardholder_name: "Escribe el nombre que aparece en la tarjeta.",
  invalid_amount: "El monto no es válido.",
  invalid_payer: "No pudimos identificar tu cuenta. Cierra sesión e inicia de nuevo.",
  bad_expiration_date: "La fecha de vencimiento no coincide con la tarjeta.",
  bad_security_code: "El CVV no coincide con la tarjeta.",
  expired_card: "La tarjeta está vencida.",
  insufficient_funds: "La tarjeta no tiene fondos suficientes.",
  card_declined: "La tarjeta fue rechazada. Prueba con otra.",
};
const REJECTED_FALLBACK = "El cobro fue rechazado. Tu saldo no cambió.";

const UNAVAILABLE_MESSAGES: Record<string, string> = {
  too_many_requests: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
  service_unavailable:
    "SnailPay no está disponible por el momento. No se aplicó ninguna recarga. Inténtalo más tarde.",
};
const UNAVAILABLE_FALLBACK =
  "SnailPay tuvo un problema interno. No se aplicó ninguna recarga. Inténtalo más tarde.";

const TIMEOUT_MESSAGE =
  "SnailPay tardó demasiado en responder y no pudimos confirmar la operación. Tu saldo no cambió. Espera unos minutos y revisa antes de volver a intentar.";
const NETWORK_MESSAGE =
  "No pudimos conectar con SnailPay. Revisa tu conexión e inténtalo de nuevo. Tu saldo no cambió.";

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";
}

function classify(httpStatus: number, body: unknown): ChargeOutcome {
  const parsed = snailPayResponseSchema.safeParse(body);
  if (!parsed.success) return { kind: "unavailable", message: UNAVAILABLE_FALLBACK };

  const response = parsed.data;
  const isApproved =
    httpStatus === 201 &&
    response.status === "approved" &&
    response.status_detail === "accredited" &&
    response.transaction_amount !== null;
  if (isApproved) return { kind: "approved", response };

  if (response.status === "rejected") {
    return {
      kind: "rejected",
      response,
      message: REJECTED_MESSAGES[response.status_detail] ?? REJECTED_FALLBACK,
    };
  }
  return {
    kind: "unavailable",
    response,
    message: UNAVAILABLE_MESSAGES[response.status_detail] ?? UNAVAILABLE_FALLBACK,
  };
}

export async function chargeCard(
  request: ChargeRequest,
  { timeoutMs = DEFAULT_TIMEOUT_MS, simulateOutage = false }: ChargeOptions = {},
): Promise<ChargeOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(simulateOutage ? { "X-Simulate-Outage": "true" } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body: unknown = await res.json().catch(() => null);
    return classify(res.status, body);
  } catch (error) {
    if (isAbortError(error)) return { kind: "timeout", message: TIMEOUT_MESSAGE };
    return { kind: "network", message: NETWORK_MESSAGE };
  } finally {
    clearTimeout(timer);
  }
}