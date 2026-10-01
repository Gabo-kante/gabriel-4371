import { z } from "zod";
import type { SessionUser } from "@/features/auth/schemas";
import { readStorage, storageKeys, writeStorage } from "@/shared/storage";
import { chargeCard, type ChargeOptions, type ChargeOutcome } from "./snailpayClient";
import type { SnailPayResponse } from "./snailpaySchemas";

const MAX_TRANSACTIONS = 50;

const savedCardSchema = z.object({
  cardNumber: z.string(),
  expirationDate: z.string(),
  cvv: z.string(),
  cardholderName: z.string(),
});

const walletSchema = z.object({
  balanceCents: z.number().int().nonnegative(),
  card: savedCardSchema.nullable(),
  transactions: z.array(
    z.object({
      id: z.string(),
      reference: z.string(),
      amountCents: z.number().int().positive(),
      createdAt: z.string(),
    }),
  ),
});
const walletsSchema = z.record(z.string(), walletSchema);

export type SavedCard = z.infer<typeof savedCardSchema>;
export type Wallet = z.infer<typeof walletSchema>;

export interface RechargeInput extends SavedCard {
  amount: number;
}

export interface RechargeResult {
  outcome: ChargeOutcome;
  wallet: Wallet;
}

type WalletErrorCode = "STORAGE_UNAVAILABLE" | "PAYER_MISMATCH" | "INVALID_APPROVAL";

export class WalletError extends Error {
  readonly code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

/** Evita errores de punto flotante */
export const toCents = (amount: number) => Math.round(amount * 100);

export const emptyWallet = (): Wallet => ({ balanceCents: 0, card: null, transactions: [] });
const loadAll = () => readStorage(storageKeys.wallets, walletsSchema, {});

export function loadWallet(userId: string): Wallet {
  return loadAll()[userId] ?? emptyWallet();
}

function saveWallet(userId: string, wallet: Wallet): boolean {
  return writeStorage(storageKeys.wallets, { ...loadAll(), [userId]: wallet });
}

export function applyApprovedCharge(
  userId: string,
  response: SnailPayResponse,
  card: SavedCard,
): Wallet {
  if (response.payer_id !== userId) {
    throw new WalletError("PAYER_MISMATCH", "La respuesta de SnailPay no corresponde a tu cuenta");
  }
  if (response.transaction_amount === null || response.transaction_amount <= 0) {
    throw new WalletError("INVALID_APPROVAL", "La aprobación no incluye un monto válido");
  }

  const wallet = loadWallet(userId);
  if (wallet.transactions.some((transaction) => transaction.id === response.id)) {
    return wallet; // la misma operación nunca se acredita dos veces
  }

  const amountCents = toCents(response.transaction_amount);
  const updated: Wallet = {
    balanceCents: wallet.balanceCents + amountCents,
    card,
    transactions: [
      { id: response.id, reference: response.reference, amountCents, createdAt: response.date_created },
      ...wallet.transactions,
    ].slice(0, MAX_TRANSACTIONS),
  };

  if (!saveWallet(userId, updated)) {
    throw new WalletError("STORAGE_UNAVAILABLE", "No se pudo guardar el nuevo saldo en el navegador");
  }
  return updated;
}

/** Cobra con SnailPay y, solo si fue aprobado, acredita el saldo. */
export async function performRecharge(
  user: SessionUser,
  input: RechargeInput,
  options?: ChargeOptions,
): Promise<RechargeResult> {
  const cardNumber = input.cardNumber.replace(/[\s-]/g, "");

  const outcome = await chargeCard(
    {
      card_number: cardNumber,
      expiration_date: input.expirationDate,
      cvv: input.cvv,
      cardholder_name: input.cardholderName,
      amount: input.amount,
      payer_id: user.id,
      payer_email: user.email,
    },
    options,
  );

  if (outcome.kind !== "approved") {
    return { outcome, wallet: loadWallet(user.id) }; // el saldo no se toca
  }

  const wallet = applyApprovedCharge(user.id, outcome.response, {
    cardNumber,
    expirationDate: input.expirationDate,
    cvv: input.cvv,
    cardholderName: input.cardholderName,
  });
  return { outcome, wallet };
}
