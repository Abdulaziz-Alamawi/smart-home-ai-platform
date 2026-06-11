"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FadeIn, LiveDot } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";
import type { ApiList, Notification } from "@/lib/types";

type Severity = "CRITICAL" | "WARNING" | "INFO";

interface UnifiedEvent {
  id: string;
  severity: Severity;
  title: string;
  ts: string;
  source: string;
}

function mapNotifSeverity(type: string): Severity {
  if (type === "ALERT") return "CRITICAL";
  if (type === "WARNING") return "WARNING";
  return "INFO";
}

const SEV_META: Record<Severity, { icon: typeof Info; cls: string; chip: string }> = {
  CRITICAL: { icon: AlertOctagon, cls: "border-red-500/30 bg-red-500/10", chip: "bg-red-500/15 text-red-500" },
  WARNING: { icon: AlertTriangle, cls: "border-amber-500/30 bg-amber-500/10", chip: "bg-amber-500/15 text-amber-500" },
  INFO: { icon: Info, cls: "border-brand-500/30 bg-brand-500/10", chip: "bg-brand-500/15 text-brand-500" },
};

export default function SecurityCenter() {
  const { t, lang } = useI18n();
  const { events: liveEvents, connected } = useRealtime();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Severity | "ALL">("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiList<Notification>>("/notifications?pageSize=50");
        setNotifs(res.items ?? []);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unified: UnifiedEvent[] = useMemo(() => {
    const fromLive: UnifiedEvent[] = liveEvents.map((e) => ({
      id: e.id,
      severity: (["CRITICAL", "WARNING", "INFO"].includes(e.severity) ? e.severity : "INFO") as Severity,
      title: e.title,
      ts: e.ts,
      source: "live",
    }));
    const fromNotifs: UnifiedEvent[] = notifs.map((n) => ({
      id: n.id,
      severity: mapNotifSeverity(n.type),
      title: n.title,
      ts: n.createdAt,
      source: "system",
    }));
    return [...fromLive, ...fromNotifs].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  }, [liveEvents, notifs]);

  const counts = useMemo(() => {
    return {
      CRITICAL: unified.filter((e) => e.severity === "CRITICAL").length,
      WARNING: unified.filter((e) => e.severity === "WARNING").length,
      INFO: unified.filter((e) => e.severity === "INFO").length,
    };
  }, [unified]);

  const filtered = unified.filter(
    (e) => (filter === "ALL" || e.severity === filter) && e.title.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Shield className="h-6 w-6 text-brand-500" /> {t("security.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("security.subtitle")}</p>
        </div>
        <span className="chip"><LiveDot active={connected} label={t("common.live")} /></span>
      </FadeIn>

      {/* Severity summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SevCard severity="CRITICAL" label={t("security.critical")} count={counts.CRITICAL} onClick={() => setFilter("CRITICAL")} active={filter === "CRITICAL"} />
        <SevCard severity="WARNING" label={t("security.warning")} count={counts.WARNING} onClick={() => setFilter("WARNING")} active={filter === "WARNING"} />
        <SevCard severity="INFO" label={t("security.info")} count={counts.INFO} onClick={() => setFilter("INFO")} active={filter === "INFO"} />
      </div>

      {/* Controls */}
      <FadeIn delay={0.1} className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input ps-9" placeholder={t("page.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button onClick={() => setFilter("ALL")} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === "ALL" ? "bg-brand-500 text-white" : "border border-gray-200 dark:border-white/10"}`}>
          {t("page.all")}
        </button>
      </FadeIn>

      {/* Event list */}
      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="glass flex flex-col items-center gap-2 p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-gray-500">{t("security.allClear")}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((e) => {
              const meta = SEV_META[e.severity];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={e.id + e.ts}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${meta.cls}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${meta.chip.split(" ")[1]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.title}</div>
                    <div className="text-xs text-gray-400">{new Date(e.ts).toLocaleString()}</div>
                  </div>
                  <span className={`badge ${meta.chip}`}>{t(`security.${e.severity.toLowerCase()}`)}</span>
                  {e.source === "live" && <span className="chip">{lang === "ar" ? "مباشر" : "live"}</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function SevCard({
  severity,
  label,
  count,
  onClick,
  active,
}: {
  severity: Severity;
  label: string;
  count: number;
  onClick: () => void;
  active: boolean;
}) {
  const meta = SEV_META[severity];
  const Icon = meta.icon;
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`glass flex items-center justify-between p-5 text-start transition ${active ? "ring-2 ring-brand-500" : ""}`}
    >
      <div>
        <div className="text-3xl font-extrabold tabular-nums">{count}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      <span className={`rounded-xl p-3 ${meta.chip}`}>
        <Icon className="h-6 w-6" />
      </span>
    </motion.button>
  );
}
