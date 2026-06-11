"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("demo@smarthome.ai");
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">{t("common.brand")}</span>
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("login.subtitle")}</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">{t("login.email")}</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t("login.password")}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <Spinner className="text-white" /> : t("login.submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              {t("login.signUp")}
            </Link>
          </p>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500 dark:bg-gray-900">
            {t("login.demo")}
          </div>
        </div>
      </div>
    </div>
  );
}
