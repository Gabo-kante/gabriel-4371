import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { WalletContext, type WalletContextValue } from "./walletContext";
import { emptyWallet, loadWallet, performRecharge, type Wallet } from "./walletService";

interface WalletState {
  userId: string | null;
  wallet: Wallet;
}

const readWallet = (userId: string | null): WalletState => ({
  userId,
  wallet: userId ? loadWallet(userId) : emptyWallet(),
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<WalletState>(() => readWallet(userId));

  if (state.userId !== userId) {
    setState(readWallet(userId));
  }

  const recharge = useCallback<WalletContextValue["recharge"]>(
    async (input, options) => {
      if (!user) throw new Error("Necesitas iniciar sesión para recargar");
      try {
        return await performRecharge(user, input, options);
      } finally {
        setState(readWallet(user.id));
      }
    },
    [user],
  );

  const value = useMemo(() => ({ wallet: state.wallet, recharge }), [state.wallet, recharge]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}