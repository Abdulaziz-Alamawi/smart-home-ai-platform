"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Cpu,
  Home,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Zap, title: t("feat.energy.t"), desc: t("feat.energy.d") },
    { icon: Sparkles, title: t("feat.ai.t"), desc: t("feat.ai.d") },
    { icon: Cpu, title: t("feat.auto.t"), desc: t("feat.auto.d") },
    { icon: BarChart3, title: t("feat.forecast.t"), desc: t("feat.forecast.d") },
    { icon: Bell, title: t("feat.notif.t"), desc: t("feat.notif.d") },
    { icon: Lock, title: t("feat.security.t"), desc: t("feat.security.d") },
  ];

  const stats = [
    { value: "6", label: t("stat.aiModules") },
    { value: "13", label: t("stat.apiModules") },
    { value: "0.94", label: t("stat.forecast") },
    { value: "95%+", label: t("stat.ready") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">{t("common.brand")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="btn-ghost">{t("common.signIn")}</Link>
            <Link href="/register" className="btn-primary">{t("common.getStarted")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 to-transparent dark:from-brand-950/30" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300">
            <Sparkles className="h-4 w-4" /> {t("landing.badge")}
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            {t("landing.heroTitle")} <span className="text-brand-600">{t("landing.heroAccent")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t("landing.heroDesc")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              {t("common.startFree")} <Arrow className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">{t("common.liveDemo")}</Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-brand-600">{s.value}</div>
                <div className="mt-1 text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            {t("landing.featuresDesc")}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition hover:shadow-elevated">
              <div className="mb-4 inline-flex rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl bg-brand-600 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">{t("landing.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            {t("landing.ctaDesc")}
          </p>
          <Link href="/register" className="btn mt-8 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
            {t("landing.ctaButton")} <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-800">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
