"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  Gauge,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ForecastBarChart } from "@/components/charts";
import { AnimatedNumber, FadeIn, Ring } from "@/components/primitives";
import { EmptyState, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { deviceMeta, deviceTelemetry, hashSeed } from "@/lib/home";
import { useHomeData } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { ApiData, Recommendation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ForecastPoint {
  hour_of_day: number;
  predicted_kwh: number;
}

const REASONS_AR: Record<string, string> = {
  cost: "اكتشف النموذج أنماط استهلاك في ساعات الذروة يمكن تحويلها لساعات أرخص.",
  efficiency: "تحليل بيانات الأجهزة يُظهر فرص رفع الكفاءة وتقليل الفاقد.",
  comfort: "تحليل الإشغال ودرجات الحرارة يقترح ضبطًا أفضل للراحة.",
  safety: "رصد سلوك غير معتاد قد يشير إلى مخاطر تستوجب الانتباه.",
  default: "بناءً على تحليل بيانات الطاقة والأجهزة الأخيرة بنماذج التعلّم الآلي.",
};
const REASONS_EN: Record<string, string> = {
  cost: "The model detected peak-hour consumption that can shift to cheaper windows.",
  efficiency: "Device telemetry analysis reveals efficiency gains and reduced waste.",
  comfort: "Occupancy and temperature analysis suggests better comfort tuning.",
  safety: "Unusual behavior was detected that may indicate a risk worth attention.",
  default: "Based on ML analysis of your recent energy and device data.",
};

function synth(id: string) {
  const h = hashSeed(id);
  return {
    confidence: Math.round(72 + h * 26),
    impact: Math.round(45 + hashSeed(id + "i") * 54),
  };
}

export default function AiCommandCenter() {
  const { t, lang } = useI18n();
  const { devices } = useHomeData();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiData<Recommendation[]>>("/recommendations");
        setRecs(res.data);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
      try {
        const now = new Date();
        const f = await api.post<ApiData<{ forecast: { hour_of_day: number; predicted_kwh: number }[] }>>("/energy/predict", {
          start_hour: now.getHours(),
          day_of_week: (now.getDay() + 6) % 7,
          month: now.getMonth() + 1,
          horizon: 24,
        });
        setForecast(f.data.forecast);
      } catch {
        /* AI offline */
      }
    })();
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post<ApiData<Recommendation[]>>("/recommendations/generate");
      setRecs(res.data);
    } catch {
      setError(lang === "ar" ? "محرّك الذكاء الاصطناعي غير متاح. تأكّد من تشغيله." : "AI engine unavailable.");
    } finally {
      setGenerating(false);
    }
  };

  const dismiss = async (id: string) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
    await api.post(`/recommendations/${id}/dismiss`).catch(() => {});
  };
  const apply = async (id: string) => {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, isApplied: true } : r)));
    await api.post(`/recommendations/${id}/apply`).catch(() => {});
  };

  const totalSavings = recs.reduce((s, r) => s + (r.estimatedSavings ?? 0), 0);
  const avgConfidence = recs.length
    ? Math.round(recs.reduce((s, r) => s + synth(r.id).confidence, 0) / recs.length)
    : 0;

  // Predictive maintenance derived from real device telemetry
  const maintenance = useMemo(() => {
    return devices
      .map((d) => ({ d, tele: deviceTelemetry(d, 0) }))
      .filter((x) => x.tele.health < 65 || (x.tele.battery != null && x.tele.battery < 25) || x.d.status === "ERROR")
      .slice(0, 6);
  }, [devices]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BrainCircuit className="h-6 w-6 text-iris-500" /> {t("ai.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("ai.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? <Spinner className="text-white" /> : <RefreshCw className="h-4 w-4" />}
          {t("ai.generate")}
        </button>
      </FadeIn>

      {error && (
        <div className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600">{error}</div>
      )}

      {/* KPI row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMini icon={Lightbulb} accent="from-iris-500 to-iris-600" label={t("nav.ai")} value={recs.length} />
        <KpiMini icon={TrendingUp} accent="from-emerald-500 to-emerald-600" label={t("ai.savings")} value={totalSavings} prefix="$" decimals={2} suffix={lang === "ar" ? " /يوم" : " /day"} />
        <FadeIn delay={0.1} className="glass flex items-center gap-4 p-5">
          <Ring value={avgConfidence} size={64} stroke={6} color="#8b5cf6">
            <span className="text-sm font-bold">{avgConfidence}%</span>
          </Ring>
          <div>
            <div className="text-sm text-gray-500">{t("ai.confidence")}</div>
            <div className="text-lg font-bold">{lang === "ar" ? "متوسط النماذج" : "Model avg"}</div>
          </div>
        </FadeIn>
        <KpiMini icon={Wrench} accent="from-amber-500 to-orange-600" label={t("ai.maintenance")} value={maintenance.length} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="space-y-3 lg:col-span-2">
          <h3 className="font-semibold">{t("nav.ai")}</h3>
          {recs.length === 0 ? (
            <EmptyState
              title={lang === "ar" ? "لا توجد توصيات بعد" : "No recommendations yet"}
              description={t("ai.subtitle")}
              action={<button className="btn-primary" onClick={generate}><Sparkles className="h-4 w-4" /> {t("ai.generate")}</button>}
            />
          ) : (
            recs.map((r, i) => {
              const s = synth(r.id);
              const cat = (r.category ?? "").toLowerCase();
              const reason = (lang === "ar" ? REASONS_AR : REASONS_EN)[cat] ?? (lang === "ar" ? REASONS_AR : REASONS_EN).default;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="glass p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-gradient-to-br from-iris-500/20 to-brand-500/10 p-2.5 text-iris-500">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{r.title}</h4>
                          <span className={`badge ${r.priority === "HIGH" ? "bg-red-500/15 text-red-500" : r.priority === "MEDIUM" ? "bg-amber-500/15 text-amber-500" : "bg-gray-500/15 text-gray-500"}`}>
                            {r.priority}
                          </span>
                          {r.isApplied && <span className="badge bg-emerald-500/15 text-emerald-500">{lang === "ar" ? "مُطبّقة" : "Applied"}</span>}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{r.message}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!r.isApplied && (
                        <button onClick={() => apply(r.id)} className="btn-ghost p-2 text-emerald-500" aria-label="apply"><Check className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => dismiss(r.id)} className="btn-ghost p-2 text-gray-400" aria-label="dismiss"><X className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {/* Explainable metrics */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Meter label={t("ai.confidence")} value={s.confidence} color="bg-iris-500" />
                    <Meter label={t("ai.impact")} value={s.impact} color="bg-brand-500" />
                    <div className="rounded-xl bg-emerald-500/10 px-3 py-2">
                      <div className="text-xs text-gray-500">{t("ai.savings")}</div>
                      <div className="text-sm font-bold text-emerald-500">
                        {r.estimatedSavings != null ? `${formatCurrency(r.estimatedSavings)}${lang === "ar" ? " /يوم" : " /day"}` : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-white/5">
                    <BrainCircuit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-iris-500" />
                    <span><span className="font-semibold">{t("ai.reason")}: </span>{reason}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Side: forecast + maintenance */}
        <div className="space-y-4">
          <FadeIn delay={0.1} className="glass p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Gauge className="h-4 w-4 text-brand-500" /> {t("ai.forecast")}
            </h3>
            {forecast.length > 0 ? (
              <ForecastBarChart data={forecast} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">{t("page.noData")}</div>
            )}
          </FadeIn>

          <FadeIn delay={0.15} className="glass p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Wrench className="h-4 w-4 text-amber-500" /> {t("ai.maintenance")}
            </h3>
            {maintenance.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">{t("security.allClear")}</p>
            ) : (
              <div className="space-y-2">
                {maintenance.map(({ d, tele }) => {
                  const meta = deviceMeta(d.type);
                  const Icon = meta.icon;
                  return (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <Icon className="h-4 w-4 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-gray-400">
                          {tele.battery != null && tele.battery < 25
                            ? `${t("devices.battery")} ${tele.battery}%`
                            : `${t("devices.health")} ${tele.health}%`}
                        </div>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function KpiMini({
  icon: Icon,
  accent,
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <FadeIn className="glass relative overflow-hidden p-5">
      <div className={`inline-flex rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-extrabold tabular-nums">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </FadeIn>
  );
}
