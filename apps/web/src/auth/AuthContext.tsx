import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse, SessionUser } from "@soundboard/shared";
import { apiFetch } from "../api/client";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  updateWeeklySeedOptIn: (enabled: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<MeResponse>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST", body: "{}" });
    setUser(null);
  }, []);

  const updateWeeklySeedOptIn = useCallback(async (enabled: boolean) => {
    const data = await apiFetch<MeResponse>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ weeklySeedOptIn: enabled }),
    });
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout, updateWeeklySeedOptIn }),
    [user, loading, refresh, logout, updateWeeklySeedOptIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
