import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { emptyWallet, loadWallet, performRecharge } from "./walletService";
import { WalletContext, type WalletContextValue } from "./walletContext";

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Contador que fuerza a releer el saldo desde localStorage tras cada recarga.
  const [version, setVersion] = useState(0);

  const wallet = useMemo(() => (user ? loadWallet(user.id) : emptyWallet()), [user, version]);

  const recharge = useCallback<WalletContextValue["recharge"]>(
    async (input, options) => {
      if (!user) throw new Error("Necesitas iniciar sesión para recargar");
      try {
        return await performRecharge(user, input, options);
      } finally {
        setVersion((current) => current + 1);
      }
    },
    [user],
  );

  const value = useMemo(() => ({ wallet, recharge }), [wallet, recharge]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}