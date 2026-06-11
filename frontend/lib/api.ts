"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api/v1";

const ACCESS_KEY = "shai_access_token";
const REFRESH_KEY = "shai_refresh_token";

export const tokenStore = {
  getAccess: () => (typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    tokenStore.set(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  { method = "GET", body, auth = true, retry = true }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiRequest<T>(path, { method, body, auth, retry: false });
    }
    tokenStore.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json?.error?.message ?? "Request failed", json?.error?.details);
  }
  return json as T;
}

export const api = {
  get: <T,>(path: string, auth = true) => apiRequest<T>(path, { method: "GET", auth }),
  post: <T,>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: "POST", body, auth }),
  patch: <T,>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  del: <T,>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
