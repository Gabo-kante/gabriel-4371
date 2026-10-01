import { beforeEach, describe, expect, it, vi } from "vitest";
import { chargeCard, type ChargeOutcome } from "./snailpayClient";
import type { SnailPayResponse } from "./snailpaySchemas";
import { loadWallet, performRecharge, toCents, type RechargeInput } from "./walletService";

vi.mock("./snailpayClient");
const chargeCardMock = vi.mocked(chargeCard);

const user = { id: "user-1", fullName: "Ana Pérez", email: "ana@example.com" };

const input: RechargeInput = {
  cardNumber: "1234 1234 1234 1234",
  expirationDate: "12/26",
  cvv: "543",
  cardholderName: "Ana Pérez",
  amount: 250,
};

function approvedResponse(overrides: Partial<SnailPayResponse> = {}): SnailPayResponse {
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

const approved = (overrides?: Partial<SnailPayResponse>): ChargeOutcome => ({
  kind: "approved",
  response: approvedResponse(overrides),
});

beforeEach(() => {
  chargeCardMock.mockReset();
});

describe("toCents", () => {
  it("evita errores de punto flotante", () => {
    expect(toCents(19.99)).toBe(1999);
  });
});

describe("performRecharge", () => {
  it("suma el monto al saldo y lo guarda en localStorage cuando se aprueba", async () => {
    chargeCardMock.mockResolvedValue(approved());

    const { wallet } = await performRecharge(user, input);

    expect(wallet.balanceCents).toBe(25_000);
    expect(loadWallet("user-1").balanceCents).toBe(25_000);
  });

  it("guarda la tarjeta (ficticia) y el CVV al aprobar", async () => {
    chargeCardMock.mockResolvedValue(approved());

    await performRecharge(user, input);

    expect(loadWallet("user-1").card).toEqual({
      cardNumber: "1234123412341234",
      expirationDate: "12/26",
      cvv: "543",
      cardholderName: "Ana Pérez",
    });
  });

  it.each<[string, ChargeOutcome]>([
    ["rechazo", { kind: "rejected", response: approvedResponse({ status: "rejected", status_detail: "card_declined" }), message: "x" }],
    ["sistema no disponible", { kind: "unavailable", message: "x" }],
    ["timeout", { kind: "timeout", message: "x" }],
    ["error de red", { kind: "network", message: "x" }],
  ])("no modifica el saldo ni la tarjeta guardada tras un %s", async (_caso, failure) => {
    chargeCardMock.mockResolvedValueOnce(approved({ id: "snp_previo", transaction_amount: 100 }));
    await performRecharge(user, { ...input, amount: 100 });
    const before = loadWallet("user-1");

    chargeCardMock.mockResolvedValueOnce(failure);
    const { outcome, wallet } = await performRecharge(user, {
      ...input,
      cardNumber: "4000000000000002",
      amount: 500,
    });

    expect(outcome.kind).toBe(failure.kind);
    expect(wallet).toEqual(before);
    expect(loadWallet("user-1")).toEqual(before);
  });

  it("no acredita dos veces la misma operación", async () => {
    chargeCardMock.mockResolvedValue(approved());

    await performRecharge(user, input);
    await performRecharge(user, input);

    expect(loadWallet("user-1").balanceCents).toBe(25_000);
  });

  it("mantiene el saldo separado por usuario", async () => {
    chargeCardMock.mockResolvedValue(approved());

    await performRecharge(user, input);

    expect(loadWallet("user-2").balanceCents).toBe(0);
  });

  it("rechaza una aprobación cuyo payer_id no es el del usuario activo", async () => {
    chargeCardMock.mockResolvedValue(approved({ payer_id: "otro-usuario" }));

    await expect(performRecharge(user, input)).rejects.toMatchObject({ code: "PAYER_MISMATCH" });
    expect(loadWallet("user-1").balanceCents).toBe(0);
  });

  it("envía a SnailPay la tarjeta sin espacios y el id y correo del usuario", async () => {
    chargeCardMock.mockResolvedValue(approved());

    await performRecharge(user, input);

    expect(chargeCardMock.mock.calls[0][0]).toMatchObject({
      card_number: "1234123412341234",
      payer_id: "user-1",
      payer_email: "ana@example.com",
      amount: 250,
    });
  });
});