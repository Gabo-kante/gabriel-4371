import { createContext } from "react";
import type { ChargeOptions } from "./snailpayClient";
import type { RechargeInput, RechargeResult, Wallet } from "./walletService";

export interface WalletContextValue {
  wallet: Wallet;
  recharge: (input: RechargeInput, options?: ChargeOptions) => Promise<RechargeResult>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);