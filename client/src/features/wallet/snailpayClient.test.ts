import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chargeCard, type ChargeRequest } from "./snailpayClient";

const request: ChargeRequest = {
  card_number: "1234123412341234",
  expiration_date: "12/26",
  cvv: "543",
  cardholder_name: "Ana Pérez",
  amount: 250,
  payer_id: "user-1",
  payer_email: "ana@example.com",
};

function snailPayBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "snp_1",
    status: "approved",
    status_detail: "accredited",
    transaction_amount: 250,
    date_created: "2026-09-30T18:00:00.000Z",
    authorization_code: "123456",
    reference: "SP-ABCDEF1234",
    payer_id: "user-1",
    payer_email: "ana@example.com",
    card_number: "1234123412341234",
    cvv: "543",
    ...overrides,
  };
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("chargeCard", () => {
  it("clasifica un 201 accredited como aprobado", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, snailPayBody()));
    const outcome = await chargeCard(request);
    expect(outcome.kind).toBe("approved");
  });

  it("clasifica un rechazo 402 con un mensaje comprensible", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(402, snailPayBody({ status: "rejected", status_detail: "bad_security_code", authorization_code: null })),
    );
    const outcome = await chargeCard(request);
    expect(outcome.kind).toBe("rejected");
    expect(outcome).toMatchObject({ message: expect.stringContaining("CVV") });
  });

  it("clasifica un 503 como sistema no disponible", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, snailPayBody({ status: "error", status_detail: "service_unavailable", authorization_code: null })),
    );
    const outcome = await chargeCard(request);
    expect(outcome.kind).toBe("unavailable");
  });

  it("no acepta como aprobado un 'approved' que no llegó con HTTP 201", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, snailPayBody()));
    const outcome = await chargeCard(request);
    expect(outcome.kind).not.toBe("approved");
  });

  it("trata una respuesta mal formada como sistema no disponible", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { hola: "mundo" }));
    const outcome = await chargeCard(request);
    expect(outcome.kind).toBe("unavailable");
  });

  it("clasifica un fallo de red", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const outcome = await chargeCard(request);
    expect(outcome.kind).toBe("network");
  });

  it("aborta y devuelve timeout cuando SnailPay tarda demasiado", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
        }),
    );

    const pending = chargeCard(request, { timeoutMs: 1_000 });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toMatchObject({ kind: "timeout" });
  });

  it("envía el payload como JSON y el header de caída solo cuando se pide", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, snailPayBody({ status: "error", status_detail: "service_unavailable" })));
    await chargeCard(request, { simulateOutage: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/snailpay/charges");
    expect(init.headers).toMatchObject({ "X-Simulate-Outage": "true" });
    expect(JSON.parse(init.body)).toMatchObject({ payer_id: "user-1", amount: 250 });
  });
});