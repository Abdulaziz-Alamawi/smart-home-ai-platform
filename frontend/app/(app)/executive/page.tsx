"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  DollarSign,
  Gauge,
  HeartPulse,
  Leaf,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AnimatedNumber, FadeIn, LiveDot, Ring } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { useHomeData } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";
import { computeScores, type ScoreCard } from "@/lib/scores";
import type { ApiData, DashboardData, EnergyPoint, Recommendation } from "@/lib/types";

function scoreColor(v: number): string {
  if (v >= 80) return "#10b981";
  if (v >= 60) return "#f59e0b";
  return "#ef4444";
}

const CARD_META: Record<string, { icon: React.ComponentType<{ className?: string }>; labelKey: string; accent: string }> = {
  homeHealth: { icon: HeartPulse, labelKey: "exec.homeHealth", accent: "from-emerald-500 to-emerald-600" },
  aiConfidence: { icon: BrainCircuit, labelKey: "exec.aiConfidence", accent: "from-iris-500 to-iris-600" },
  deviceReliability: { icon: Wifi, labelKey: "exec.deviceReliability", accent: "from-brand-500 to-brand-600" },
  energyEfficiency: { icon: Leaf, labelKey: "exec.energyEfficiency", accent: "from-green-500 to-emerald-600" },
  security: { icon: ShieldCheck, labelKey: "exec.security", accent: "from-cyan-500 to-brand-600" },
  savings: { icon: DollarSign, labelKey: "exec.savings", accent: "from-amber-500 to-orange-600" },
};

export default function ExecutivePage() {
  const { t } = useI18n();
  const { iot, events, connected } = useRealtime();
  const { devices } = useHomeData();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [series, setSeries] = useState<EnergyPoint[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, ts, r] = await Promise.all([
          api.get<ApiData<DashboardData>>("/analytics/dashboard"),
          api.get<ApiData<EnergyPoint[]>>("/energy/timeseries"),
          api.get<ApiData<Recommendation[]>>("/recommendations"),
        ]);
        setDash(d.data);
        setSeries(ts.data);
        setRecs(r.data);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scores = useMemo(
    () =>
      computeScores({
        iot,
        devices,
        energySeries: series,
        recommendations: recs,
        events,
        monthlyCost: dash?.energy.monthlyCost ?? 0,
      }),
    [iot, devices, series, recs, events, dash]
  );

  if (loading) return <PageLoader />;

  const cards: ScoreCard[] = [
    scores.homeHealth,
    scores.aiConfidence,
    scores.deviceReliability,
    scores.energyEfficiency,
    scores.security,
    scores.savings,
  ];

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Gauge className="h-6 w-6 text-brand-500" /> {t("exec.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("exec.subtitle")}</p>
        </div>
        <span className="chip"><LiveDot active={connected} label={t("common.live")} /></span>
      </FadeIn>

      {/* Hero overall score */}
      <FadeIn delay={0.05} className="mt-6">
        <div className="glass relative overflow-hidden p-6">
          <div className="absolute inset-0 -z-10 bg-radial-glow opacity-70" />
          <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-6">
              <Ring value={scores.overall} size={140} stroke={12} color={scoreColor(scores.overall)}>
                <div className="text-center">
                  <div className="text-4xl font-extrabold tabular-nums">{scores.overall}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-400">{t("exec.overall")}</div>
                </div>
              </Ring>
              <div>
                <div className="text-sm text-gray-500">{t("exec.monthlySavings")}</div>
                <div className="stat-gradient text-4xl font-extrabold tabular-nums">
                  <AnimatedNumber value={scores.monthlySavings} prefix="$" decimals={2} />
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-500">
                  <TrendingUp className="h-4 w-4" /> {t("exec.savings")} {scores.savings.value}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cards.map((c) => (
                <div key={c.key} className="rounded-xl bg-white/50 p-3 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t(CARD_META[c.key].labelKey)}</span>
                    <span className={`text-[11px] ${c.delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {c.delta >= 0 ? "▲" : "▼"} {Math.abs(c.delta)}
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Score cards grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => {
          const meta = CARD_META[c.key];
          const Icon = meta.icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass flex items-center gap-4 p-5"
            >
              <Ring value={c.value} size={72} stroke={7} color={scoreColor(c.value)}>
                <Icon className={`h-5 w-5 ${c.value >= 80 ? "text-emerald-500" : c.value >= 60 ? "text-amber-500" : "text-red-500"}`} />
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t(meta.labelKey)}</h3>
                  <span className={`flex items-center gap-0.5 text-xs ${c.delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {c.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(c.delta)}
                  </span>
                </div>
                <div className="mt-1 text-3xl font-extrabold tabular-nums">{c.value}<span className="text-base text-gray-400">/100</span></div>
                <p className="mt-0.5 text-xs text-gray-400">{c.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Executive summary */}
      <FadeIn delay={0.15} className="mt-4 glass p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Activity className="h-4 w-4 text-brand-500" /> {t("exec.summary")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label={t("overview.devicesOnline")} value={`${iot?.fleet.online ?? 0}/${iot?.fleet.total ?? devices.length}`} />
          <Summary label={t("overview.netPower")} value={`${iot?.power.netKw ?? 0} kW`} />
          <Summary label={t("nav.ai")} value={`${recs.length}`} />
          <Summary label={t("energy.monthlyCost")} value={`$${dash?.energy.monthlyCost ?? 0}`} />
        </div>
      </FadeIn>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
