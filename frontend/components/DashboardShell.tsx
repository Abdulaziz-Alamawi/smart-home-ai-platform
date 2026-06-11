"use client";

import { Activity, LogOut, Menu, Sun, Users, Wind, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";
import { PageLoader } from "./ui";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { LiveDot } from "./primitives";

function TelemetryStrip() {
  const { telemetry, connected } = useRealtime();
  const { t } = useI18n();
  const items = [
    { icon: Zap, label: t("nav.energy"), value: telemetry ? `${telemetry.netKw} kW` : "—", color: "text-brand-500" },
    { icon: Sun, label: "Solar", value: telemetry ? `${telemetry.solarKw} kW` : "—", color: "text-amber-500" },
    { icon: Users, label: t("twin.occupancy"), value: telemetry ? `${telemetry.occupancy}` : "—", color: "text-iris-500" },
    { icon: Wind, label: "CO₂", value: telemetry ? `${telemetry.co2}` : "—", color: "text-emerald-500" },
  ];
  return (
    <div className="hidden items-center gap-4 xl:flex">
      <span className="chip">
        <Activity className="h-3.5 w-3.5 text-emerald-500" />
        <LiveDot active={connected} label={t("common.live")} />
      </span>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-sm">
          <it.icon className={`h-4 w-4 ${it.color}`} />
          <span className="font-semibold tabular-nums">{it.value}</span>
          <span className="text-xs text-gray-400">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const { connected } = useRealtime();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <PageLoader />;
  if (!user) return null;

  return (
    <div className="app-bg flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar connected={connected} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute start-0 top-0 h-full">
            <Sidebar connected={connected} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/60 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-surface-100/40 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <TelemetryStrip />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <div className="mx-1 hidden text-end sm:block">
              <div className="text-sm font-semibold leading-tight">{user.fullName}</div>
              <div className="text-[11px] text-brand-500">{user.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-iris-600 text-sm font-semibold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} className="btn-ghost p-2" aria-label={t("common.signOut")}>
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
