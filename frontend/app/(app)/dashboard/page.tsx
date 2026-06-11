"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Cpu,
  Gauge,
  Radio,
  ShieldCheck,
  Wifi,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EnergyAreaChart } from "@/components/charts";
import { AnimatedNumber, FadeIn, LiveDot, Ring, Sparkline } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { roomTelemetry } from "@/lib/home";
import { useHomeData, useTick } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";
import type { ApiData, DashboardData, EnergyPoint } from "@/lib/types";

const severityStyle: Record<string, string> = {
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-500",
  WARNING: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  INFO: "border-brand-500/30 bg-brand-500/10 text-brand-500",
};

export default function OverviewPage() {
  const { t } = useI18n();
  const { telemetry, events, connected } = useRealtime();
  const { devices, rooms, loading } = useHomeData();
  const tick = useTick(4000);
  const [data, setData] = useState<DashboardData | null>(null);
  const [series, setSeries] = useState<EnergyPoint[]>([]);
  const [powerHistory, setPowerHistory] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [dash, ts] = await Promise.all([
          api.get<ApiData<DashboardData>>("/analytics/dashboard"),
          api.get<ApiData<EnergyPoint[]>>("/energy/timeseries"),
        ]);
        setData(dash.data);
        setSeries(ts.data);
      } catch {
        /* interceptor handles */
      }
    })();
  }, []);

  useEffect(() => {
    if (telemetry) setPowerHistory((p) => [...p, telemetry.netKw].slice(-24));
  }, [telemetry]);

  const roomTele = useMemo(() => rooms.map((r) => roomTelemetry(r, devices, tick)), [rooms, devices, tick]);
  const avgHealth = roomTele.length ? Math.round(roomTele.reduce((a, r) => a + r.health, 0) / roomTele.length) : 100;
  const activeDevices = devices.filter((d) => d.isOn).length;

  if (loading && !data) return <PageLoader />;

  const d = data ?? {
    devices: { total: 0, online: 0, offline: 0, error: 0 },
    energy: { monthlyKwh: 0, monthlyCost: 0 },
    notifications: { unread: 0 },
    insights: { count: 0, top: [] },
  };

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("overview.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("overview.subtitle")}</p>
        </div>
        <span className="chip">
          <Radio className="h-3.5 w-3.5 text-emerald-500" />
          <LiveDot active={connected} label={t("common.live")} />
        </span>
      </FadeIn>

      {/* Hero live power panel */}
      <FadeIn delay={0.05} className="mt-6">
        <div className="glass relative overflow-hidden p-6">
          <div className="absolute inset-0 -z-10 bg-radial-glow opacity-60" />
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <p className="text-sm text-gray-500">{t("overview.netPower")}</p>
              <div className="mt-1 flex items-end gap-1">
                <span className="stat-gradient text-5xl font-extrabold tabular-nums">
                  <AnimatedNumber value={telemetry?.netKw ?? 0} decimals={2} />
                </span>
                <span className="mb-1 text-lg font-semibold text-gray-400">kW</span>
              </div>
              <div className="mt-3 h-10">
                <Sparkline data={powerHistory.length ? powerHistory : [0, 0]} width={220} height={40} />
              </div>
            </div>
            <HeroStat icon={Wifi} label={t("overview.devicesOnline")} value={d.devices.online} total={d.devices.total} accent="text-emerald-500" />
            <HeroStat icon={Cpu} label={t("overview.activeNow")} value={activeDevices} total={d.devices.total} accent="text-brand-500" />
            <div className="flex items-center justify-center">
              <Ring value={avgHealth} size={104} stroke={9} color="#06b6d4">
                <div className="text-center">
                  <div className="text-2xl font-extrabold tabular-nums">{avgHealth}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">{t("overview.health")}</div>
                </div>
              </Ring>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* KPI cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Zap} label={t("energy.monthlyKwh")} value={d.energy.monthlyKwh} suffix=" kWh" accent="from-brand-500 to-brand-600" delay={0.05} />
        <KpiCard icon={Gauge} label={t("energy.monthlyCost")} value={d.energy.monthlyCost} prefix="$" decimals={2} accent="from-emerald-500 to-emerald-600" delay={0.1} />
        <KpiCard icon={Bell} label={t("nav.notifications")} value={d.notifications.unread} accent="from-amber-500 to-amber-600" delay={0.15} />
        <KpiCard icon={ShieldCheck} label={t("nav.ai")} value={d.insights.count} accent="from-iris-500 to-iris-600" delay={0.2} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Energy chart */}
        <FadeIn delay={0.1} className="glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{t("energy.title")}</h3>
            <Link href="/energy" className="text-sm font-medium text-brand-500 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          {series.length > 0 ? (
            <EnergyAreaChart data={series} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">{t("page.noData")}</div>
          )}
        </FadeIn>

        {/* Live event feed */}
        <FadeIn delay={0.15} className="glass flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold">{t("overview.liveFeed")}</h3>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden">
            <AnimatePresence initial={false}>
              {events.slice(0, 6).map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl border px-3 py-2 text-sm ${severityStyle[e.severity] ?? severityStyle.INFO}`}
                >
                  <div className="font-medium text-gray-800 dark:text-gray-100">{e.title}</div>
                  <div className="text-[11px] text-gray-400">{new Date(e.ts).toLocaleTimeString()}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">{t("overview.noEvents")}</p>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Rooms mini-grid */}
      <FadeIn delay={0.2} className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{t("overview.rooms")}</h3>
          <Link href="/twin" className="text-sm font-medium text-brand-500 hover:underline">
            {t("nav.twin")}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {roomTele.map((r) => (
            <Link key={r.id} href="/twin" className="glass p-3 transition hover:shadow-glow">
              <div className="text-xl">{r.archetype.icon}</div>
              <div className="mt-1 truncate text-sm font-medium">{r.name}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                <span>{r.temperature}°</span>
                <span>{r.activeCount}/{r.deviceCount}</span>
              </div>
            </Link>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  total,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  accent: string;
}) {
  return (
    <div>
      <Icon className={`h-5 w-5 ${accent}`} />
      <div className="mt-2 text-3xl font-extrabold tabular-nums">
        <AnimatedNumber value={value} />
        <span className="text-base font-medium text-gray-400"> / {total}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="glass relative overflow-hidden p-5">
      <div className={`absolute end-0 top-0 h-20 w-20 rounded-bl-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className={`inline-flex rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </FadeIn>
  );
}
