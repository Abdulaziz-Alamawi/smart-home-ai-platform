"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, tokenStore } from "./api";
import { ApiData, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthResponse {
  success: boolean;
  data: { user: User; accessToken: string; refreshToken: string };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<ApiData<User>>("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password }, false);
    tokenStore.set(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    router.push("/dashboard");
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await api.post<AuthResponse>("/auth/register", { email, password, fullName }, false);
    tokenStore.set(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    router.push("/dashboard");
  };

  const logout = () => {
    const refreshToken = tokenStore.getRefresh();
    if (refreshToken) void api.post("/auth/logout", { refreshToken }, false).catch(() => {});
    tokenStore.clear();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
