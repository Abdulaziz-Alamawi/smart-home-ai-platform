"use client";

import { BarChart3, Camera, Gauge, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { CostLineChart, EnergyAreaChart } from "@/components/charts";
import { AnimatedNumber, FadeIn } from "@/components/primitives";
import { PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ApiData } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalEnergyKwh: number;
  totalCost: number;
  peakHour: number;
  loadFactor: number;
}

export default function AnalyticsPage() {
  const { t, lang } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapping, setSnapping] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<ApiData<Report[]>>("/analytics/reports");
      setReports(res.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const snapshot = async () => {
    setSnapping(true);
    try {
      await api.post("/analytics/snapshot");
      await load();
    } catch {
      /* handled */
    } finally {
      setSnapping(false);
    }
  };

  if (loading) return <PageLoader />;

  const ordered = [...reports].sort((a, b) => +new Date(a.periodStart) - +new Date(b.periodStart));
  const energySeries = ordered.map((r) => ({ date: r.periodStart.slice(0, 10), energyKwh: r.totalEnergyKwh }));
  const costSeries = ordered.map((r) => ({ date: r.periodStart.slice(0, 10), cost: r.totalCost }));
  const totalKwh = reports.reduce((s, r) => s + r.totalEnergyKwh, 0);
  const totalCost = reports.reduce((s, r) => s + r.totalCost, 0);
  const avgLoad = reports.length ? reports.reduce((s, r) => s + r.loadFactor, 0) / reports.length : 0;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="h-6 w-6 text-iris-500" /> {t("analytics.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("analytics.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={snapshot} disabled={snapping}>
          {snapping ? <Spinner className="text-white" /> : <Camera className="h-4 w-4" />}
          {lang === "ar" ? "لقطة جديدة" : "New snapshot"}
        </button>
      </FadeIn>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={BarChart3} accent="from-brand-500 to-brand-600" label={lang === "ar" ? "إجمالي التقارير" : "Total reports"} value={reports.length} />
        <Kpi icon={TrendingUp} accent="from-iris-500 to-iris-600" label={lang === "ar" ? "إجمالي الطاقة" : "Total energy"} value={totalKwh} suffix=" kWh" decimals={1} />
        <Kpi icon={Gauge} accent="from-emerald-500 to-emerald-600" label={lang === "ar" ? "إجمالي التكلفة" : "Total cost"} value={totalCost} prefix="$" decimals={2} />
        <Kpi icon={Gauge} accent="from-amber-500 to-orange-600" label={lang === "ar" ? "متوسط معامل الحمل" : "Avg load factor"} value={avgLoad} decimals={2} />
      </div>

      {ordered.length > 0 ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <FadeIn delay={0.1} className="glass p-5">
            <h3 className="mb-4 font-semibold">{lang === "ar" ? "اتجاه الطاقة" : "Energy trend"}</h3>
            <EnergyAreaChart data={energySeries} />
          </FadeIn>
          <FadeIn delay={0.15} className="glass p-5">
            <h3 className="mb-4 font-semibold">{lang === "ar" ? "اتجاه التكلفة" : "Cost trend"}</h3>
            <CostLineChart data={costSeries} />
          </FadeIn>
        </div>
      ) : (
        <div className="mt-6 glass p-12 text-center text-sm text-gray-400">
          {lang === "ar" ? "لا توجد تقارير بعد — أنشئ لقطة لتبدأ." : "No reports yet — create a snapshot to begin."}
        </div>
      )}

      {/* Reports table */}
      {reports.length > 0 && (
        <FadeIn delay={0.2} className="mt-4 glass overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-start text-xs uppercase tracking-wide text-gray-400 dark:border-white/10">
                  <th className="px-5 py-3 text-start">{lang === "ar" ? "الفترة" : "Period"}</th>
                  <th className="px-5 py-3 text-start">kWh</th>
                  <th className="px-5 py-3 text-start">{lang === "ar" ? "التكلفة" : "Cost"}</th>
                  <th className="px-5 py-3 text-start">{t("energy.peak")}</th>
                  <th className="px-5 py-3 text-start">{lang === "ar" ? "معامل الحمل" : "Load factor"}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5">
                    <td className="px-5 py-3">{new Date(r.periodStart).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-medium tabular-nums">{formatNumber(r.totalEnergyKwh)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatCurrency(r.totalCost)}</td>
                    <td className="px-5 py-3 tabular-nums">{r.peakHour}:00</td>
                    <td className="px-5 py-3 tabular-nums">{r.loadFactor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

function Kpi({
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
