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

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("register.pwError"));
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("register.failed"));
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
          <h1 className="text-2xl font-semibold">{t("register.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("register.subtitle")}</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">{t("register.fullName")}</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t("register.email")}</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t("register.password")}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{t("register.passwordHint")}</p>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <Spinner className="text-white" /> : t("register.submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              {t("register.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
