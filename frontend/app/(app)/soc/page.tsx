"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  DoorClosed,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useMemo } from "react";

import { AnimatedNumber, FadeIn, LiveDot } from "@/components/primitives";
import { useI18n } from "@/lib/i18n";
import { useRealtime, type SimDevice } from "@/lib/realtime";

const sevColor: Record<string, string> = {
  CRITICAL: "#ef4444",
  WARNING: "#f59e0b",
  INFO: "#06b6d4",
};

export default function SecurityOpsCenter() {
  const { t, lang } = useI18n();
  const { iot, events, connected } = useRealtime();

  const devices: SimDevice[] = iot?.devices ?? [];
  const cameras = devices.filter((d) => d.type === "CAMERA");
  const sensors = devices.filter((d) => d.type === "MOTION_SENSOR" || d.type === "DOOR_SENSOR");
  const accessPoints = devices.filter((d) => d.type === "LOCK" || d.type === "DOOR_SENSOR");

  const securityEvents = useMemo(
    () => events.filter((e) => ["SECURITY", "MOTION", "DEVICE", "OCCUPANCY"].includes(e.type)),
    [events]
  );
  const intrusions = securityEvents.filter((e) => e.type === "SECURITY");
  const doorEvents = securityEvents.filter((e) => e.title.toLowerCase().includes("door") || e.title.includes("باب") || e.type === "SECURITY");

  const systemSecure = intrusions.length === 0;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldAlert className="h-6 w-6 text-brand-500" /> {t("soc.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("soc.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: systemSecure ? "#10b98122" : "#ef444422", color: systemSecure ? "#10b981" : "#ef4444" }}
          >
            {systemSecure ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {t(systemSecure ? "soc.secure" : "soc.alert")}
          </span>
          <span className="chip"><LiveDot active={connected} label={t("common.live")} /></span>
        </div>
      </FadeIn>

      {/* Stat row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Camera} accent="from-brand-500 to-brand-600" label={t("soc.cameras")} value={cameras.filter((c) => c.online).length} total={cameras.length} />
        <Stat icon={Radar} accent="from-iris-500 to-iris-600" label={t("soc.sensors")} value={sensors.filter((s) => s.online).length} total={sensors.length} />
        <Stat icon={DoorClosed} accent="from-emerald-500 to-emerald-600" label={t("soc.doors")} value={accessPoints.filter((a) => a.online).length} total={accessPoints.length} />
        <Stat icon={ShieldAlert} accent="from-red-500 to-orange-600" label={t("soc.intrusions")} value={intrusions.length} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Camera grid */}
        <FadeIn delay={0.05} className="glass p-5 lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Video className="h-4 w-4 text-brand-500" /> {t("soc.cameras")}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cameras.map((cam) => (
              <div key={cam.id} className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-surface-200 to-surface-300 dark:border-white/10">
                {/* Simulated CCTV feed */}
                <div className="absolute inset-0 bg-grid-dark opacity-30" style={{ backgroundSize: "16px 16px" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className={`h-8 w-8 ${cam.online ? "text-brand-400/60" : "text-gray-500/40"}`} />
                </div>
                {cam.online && (
                  <div className="absolute end-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> REC
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-[11px] text-white">
                  <span className="truncate">{cam.name}</span>
                  <span className={cam.online ? "text-emerald-400" : "text-gray-400"}>{t(cam.online ? "common.online" : "common.offline")}</span>
                </div>
              </div>
            ))}
            {cameras.length === 0 && <p className="col-span-full py-8 text-center text-sm text-gray-400">{t("page.noData")}</p>}
          </div>
        </FadeIn>

        {/* Security timeline */}
        <FadeIn delay={0.1} className="glass flex flex-col p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-red-500" /> {t("soc.timeline")}
          </h3>
          <div className="flex-1 space-y-2 overflow-hidden">
            <AnimatePresence initial={false}>
              {securityEvents.slice(0, 8).map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 border-s-2 ps-3"
                  style={{ borderColor: sevColor[e.severity] ?? sevColor.INFO }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{e.title}</div>
                    <div className="text-[11px] text-gray-400">{new Date(e.ts).toLocaleTimeString()}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {securityEvents.length === 0 && <p className="py-8 text-center text-sm text-gray-400">{t("security.allClear")}</p>}
          </div>
        </FadeIn>
      </div>

      {/* Sensors + door activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.1} className="glass p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Radar className="h-4 w-4 text-iris-500" /> {t("soc.sensors")}
          </h3>
          <div className="space-y-2">
            {sensors.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
                {s.type === "MOTION_SENSOR" ? <Radar className="h-4 w-4 text-iris-500" /> : <DoorClosed className="h-4 w-4 text-brand-500" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.room} · {t("devices.battery")} {Math.round(s.battery)}%</div>
                </div>
                <LiveDot active={s.online} />
              </div>
            ))}
            {sensors.length === 0 && <p className="py-6 text-center text-sm text-gray-400">{t("page.noData")}</p>}
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="glass p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <DoorClosed className="h-4 w-4 text-emerald-500" /> {t("soc.doorActivity")}
          </h3>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {doorEvents.slice(0, 6).map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: `${sevColor[e.severity] ?? sevColor.INFO}14` }}
                >
                  <DoorClosed className="h-4 w-4" style={{ color: sevColor[e.severity] ?? sevColor.INFO }} />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  <span className="text-[11px] text-gray-400">{new Date(e.ts).toLocaleTimeString()}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {doorEvents.length === 0 && <p className="py-6 text-center text-sm text-gray-400">{t("security.allClear")}</p>}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  accent,
  label,
  value,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  label: string;
  value: number;
  total?: number;
}) {
  return (
    <FadeIn className="glass relative overflow-hidden p-5">
      <div className={`inline-flex rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-3xl font-extrabold tabular-nums">
        <AnimatedNumber value={value} />
        {total != null && <span className="text-base font-medium text-gray-400"> / {total}</span>}
      </div>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </FadeIn>
  );
}
