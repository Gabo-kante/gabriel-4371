import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import * as authService from "./authService";
import type { SessionUser } from "./schemas";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => authService.getSession());

  const register = useCallback<AuthContextValue["register"]>(async (input) => {
    setUser(await authService.register(input));
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (input) => {
    setUser(await authService.login(input));
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, register, login, logout }),
    [user, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}