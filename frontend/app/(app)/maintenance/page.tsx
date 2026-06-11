"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BatteryWarning, CalendarClock, CheckCircle2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { FadeIn, Ring } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { deviceMeta } from "@/lib/home";
import { useHomeData, useTick } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import {
  maintenanceReport,
  RECOMMENDATION_TEXT,
  riskColor,
  type MaintenanceReport,
  type RiskLevel,
} from "@/lib/maintenance";

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, atRisk: 1, healthy: 2 };

export default function MaintenancePage() {
  const { t, lang } = useI18n();
  const { devices, loading } = useHomeData();
  const tick = useTick(6000);
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  const reports = useMemo(
    () => devices.map((d) => maintenanceReport(d, tick)).sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.failureProbability - a.failureProbability),
    [devices, tick]
  );

  const counts = useMemo(
    () => ({
      critical: reports.filter((r) => r.risk === "critical").length,
      atRisk: reports.filter((r) => r.risk === "atRisk").length,
      healthy: reports.filter((r) => r.risk === "healthy").length,
    }),
    [reports]
  );

  const filtered = filter === "all" ? reports : reports.filter((r) => r.risk === filter);

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Wrench className="h-6 w-6 text-amber-500" /> {t("maint.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("maint.subtitle")}</p>
      </FadeIn>

      {/* Risk summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <RiskCard label={t("maint.critical")} count={counts.critical} color="#ef4444" active={filter === "critical"} onClick={() => setFilter(filter === "critical" ? "all" : "critical")} />
        <RiskCard label={t("maint.atRisk")} count={counts.atRisk} color="#f59e0b" active={filter === "atRisk"} onClick={() => setFilter(filter === "atRisk" ? "all" : "atRisk")} />
        <RiskCard label={t("maint.healthy")} count={counts.healthy} color="#10b981" active={filter === "healthy"} onClick={() => setFilter(filter === "healthy" ? "all" : "healthy")} />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 glass flex flex-col items-center gap-2 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm text-gray-500">{t("maint.allHealthy")}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filtered.map((r, i) => (
            <ReportCard key={r.device.id} r={r} i={i} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ r, i, t, lang }: { r: MaintenanceReport; i: number; t: (k: string) => string; lang: string }) {
  const meta = deviceMeta(r.device.type);
  const Icon = meta.icon;
  const remainingText =
    r.remainingMonths >= 12
      ? `${Math.round(r.remainingMonths / 12)} ${lang === "ar" ? "سنة" : "yr"}`
      : `${r.remainingMonths} ${t("maint.months")}`;
  const recIcon = r.recommendationKey === "battery" ? BatteryWarning : r.recommendationKey === "ok" || r.recommendationKey === "monitor" ? CheckCircle2 : AlertTriangle;
  const RecIcon = recIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3) }}
      className="glass p-5"
    >
      <div className="flex items-start gap-4">
        <Ring value={r.failureProbability} size={72} stroke={7} color={riskColor(r.risk)}>
          <div className="text-center">
            <div className="text-sm font-bold" style={{ color: riskColor(r.risk) }}>{r.failureProbability}%</div>
            <div className="text-[8px] text-gray-400">{t("maint.failureProb")}</div>
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <h3 className="truncate font-semibold">{r.device.name}</h3>
            <span
              className="ms-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `${riskColor(r.risk)}22`, color: riskColor(r.risk) }}
            >
              {t(`maint.${r.risk}`)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {lang === "ar" ? meta.labelAr : meta.labelEn}
            {r.device.room ? ` · ${r.device.room.name}` : ""}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Mini label={t("maint.remaining")} value={remainingText} />
            <Mini label={t("devices.health")} value={`${r.health}%`} />
            <Mini label={t("maint.lifespan")} value={`${Math.round(r.lifespanMonths / 12)} ${lang === "ar" ? "سنة" : "yr"}`} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-white/5">
        <span className="flex items-center gap-1.5 text-gray-500">
          <CalendarClock className="h-4 w-4" /> {t("maint.schedule")}: <span className="font-semibold text-gray-700 dark:text-gray-200">{r.serviceInDays} {t("maint.days")}</span>
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: `${riskColor(r.risk)}14` }}>
        <RecIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: riskColor(r.risk) }} />
        <span><span className="font-semibold">{t("maint.recommendation")}: </span>{RECOMMENDATION_TEXT[r.recommendationKey][lang === "ar" ? "ar" : "en"]}</span>
      </div>
    </motion.div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 py-2 dark:bg-white/5">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

function RiskCard({ label, count, color, active, onClick }: { label: string; count: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`glass flex items-center justify-between p-5 text-start transition ${active ? "ring-2" : ""}`}
      style={active ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      <div>
        <div className="text-3xl font-extrabold tabular-nums">{count}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      <span className="h-12 w-12 rounded-2xl" style={{ backgroundColor: `${color}22` }}>
        <Wrench className="m-3 h-6 w-6" style={{ color }} />
      </span>
    </motion.button>
  );
}
