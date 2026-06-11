"use client";

import { motion } from "framer-motion";
import {
  BatteryMedium,
  CheckCircle2,
  Plus,
  Power,
  Signal,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { FadeIn, LevelBars, Ring } from "@/components/primitives";
import { EmptyState, PageLoader } from "@/components/ui";
import {
  batteryColor,
  deviceMeta,
  deviceTelemetry,
  healthColor,
  type DeviceCategory,
} from "@/lib/home";
import { api } from "@/lib/api";
import { useHomeData, useTick } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import type { Device } from "@/lib/types";

const DEVICE_TYPES = [
  "LIGHT", "SWITCH", "PLUG", "THERMOSTAT", "AC", "FAN",
  "LOCK", "CAMERA", "MOTION_SENSOR", "DOOR_SENSOR", "ENERGY_METER", "TV", "SPEAKER",
];

const CATEGORIES: { id: DeviceCategory | "all"; ar: string; en: string }[] = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "light", ar: "إضاءة", en: "Lighting" },
  { id: "climate", ar: "تكييف", en: "Climate" },
  { id: "security", ar: "أمان", en: "Security" },
  { id: "sensor", ar: "حسّاسات", en: "Sensors" },
  { id: "energy", ar: "طاقة", en: "Energy" },
  { id: "media", ar: "وسائط", en: "Media" },
];

export default function DeviceControlCenter() {
  const { t, lang } = useI18n();
  const { devices, loading, reload, setDevices } = useHomeData();
  const tick = useTick(5000);
  const [cat, setCat] = useState<DeviceCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "LIGHT", powerRatingKw: 0.5 });

  const filtered = useMemo(
    () => (cat === "all" ? devices : devices.filter((d) => deviceMeta(d.type).category === cat)),
    [devices, cat]
  );

  const toggle = async (d: Device) => {
    setDevices((prev) => prev.map((x) => (x.id === d.id ? { ...x, isOn: !x.isOn, status: !x.isOn ? "ONLINE" : "OFFLINE" } : x)));
    try {
      await api.post(`/devices/${d.id}/toggle`, { isOn: !d.isOn });
    } catch {
      void reload();
    }
  };

  const remove = async (id: string) => {
    setDevices((prev) => prev.filter((x) => x.id !== id));
    try {
      await api.del(`/devices/${id}`);
    } catch {
      void reload();
    }
  };

  const bulkToggle = async (on: boolean) => {
    const ids = Array.from(selected);
    setDevices((prev) => prev.map((x) => (selected.has(x.id) ? { ...x, isOn: on, status: on ? "ONLINE" : "OFFLINE" } : x)));
    setSelected(new Set());
    await Promise.all(ids.map((id) => api.post(`/devices/${id}/toggle`, { isOn: on }).catch(() => {})));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    try {
      await api.post("/devices", form);
    } finally {
      setForm({ name: "", type: "LIGHT", powerRatingKw: 0.5 });
      void reload();
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("devices.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("devices.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> {lang === "ar" ? "إضافة جهاز" : "Add device"}
        </button>
      </FadeIn>

      {/* Category filters */}
      <FadeIn delay={0.05} className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              cat === c.id
                ? "bg-gradient-to-r from-brand-500 to-iris-600 text-white shadow-sm"
                : "border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            }`}
          >
            {lang === "ar" ? c.ar : c.en}
          </button>
        ))}
      </FadeIn>

      {showForm && (
        <FadeIn className="mt-4">
          <form onSubmit={create} className="glass grid gap-4 p-5 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="label">{lang === "ar" ? "الاسم" : "Name"}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "النوع" : "Type"}</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {DEVICE_TYPES.map((ty) => (
                  <option key={ty} value={ty}>{lang === "ar" ? deviceMeta(ty).labelAr : deviceMeta(ty).labelEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("devices.power")} (kW)</label>
              <input type="number" step="0.1" min="0.01" className="input" value={form.powerRatingKw}
                onChange={(e) => setForm({ ...form, powerRatingKw: parseFloat(e.target.value) })} />
            </div>
            <div className="flex gap-2 sm:col-span-4">
              <button type="submit" className="btn-primary">{lang === "ar" ? "إنشاء" : "Create"}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t("automation.cancel")}</button>
            </div>
          </form>
        </FadeIn>
      )}

      {/* Device grid */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={lang === "ar" ? "لا توجد أجهزة" : "No devices"} description={t("devices.subtitle")} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d, i) => {
            const tele = deviceTelemetry(d, tick);
            const meta = deviceMeta(d.type);
            const Icon = meta.icon;
            const isSel = selected.has(d.id);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`glass relative p-5 transition ${isSel ? "ring-2 ring-brand-500" : ""}`}
              >
                <button
                  onClick={() => toggleSelect(d.id)}
                  className={`absolute end-3 top-3 rounded-full p-1 transition ${isSel ? "text-brand-500" : "text-gray-300 hover:text-gray-400 dark:text-gray-600"}`}
                  aria-label="select"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                  <span className={`relative rounded-xl p-3 ${d.isOn ? "bg-brand-500/15 text-brand-500" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                    <Icon className="h-5 w-5" />
                    {d.status === "ONLINE" && (
                      <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-100" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{d.name}</h3>
                    <p className="truncate text-xs text-gray-400">
                      {lang === "ar" ? meta.labelAr : meta.labelEn}{d.room ? ` · ${d.room.name}` : ""}
                    </p>
                  </div>
                </div>

                {/* Telemetry */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center rounded-lg bg-gray-50 py-2 dark:bg-white/5">
                    <Ring value={tele.health} size={38} stroke={4} color={tele.health >= 80 ? "#10b981" : tele.health >= 55 ? "#f59e0b" : "#ef4444"}>
                      <span className={`text-[10px] font-bold ${healthColor(tele.health)}`}>{tele.health}</span>
                    </Ring>
                    <span className="mt-1 text-[10px] text-gray-400">{t("devices.health")}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-2 dark:bg-white/5">
                    {tele.hasBattery && tele.battery != null ? (
                      <>
                        <BatteryMedium className={`h-4 w-4 ${batteryColor(tele.battery)}`} />
                        <span className="mt-1 text-sm font-semibold tabular-nums">{tele.battery}%</span>
                        <span className="text-[10px] text-gray-400">{t("devices.battery")}</span>
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 text-gray-400" />
                        <span className="mt-1 text-sm font-semibold tabular-nums">{d.powerRatingKw}</span>
                        <span className="text-[10px] text-gray-400">kW</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-2 dark:bg-white/5">
                    <Signal className="h-4 w-4 text-brand-500" />
                    <LevelBars value={tele.signal} className="mt-1.5" />
                    <span className="mt-1 text-[10px] text-gray-400">{t("devices.signal")}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => toggle(d)} className={d.isOn ? "btn-primary px-3 py-1.5" : "btn-secondary px-3 py-1.5"}>
                    <Power className="h-4 w-4" /> {d.isOn ? (lang === "ar" ? "تشغيل" : "On") : (lang === "ar" ? "إيقاف" : "Off")}
                  </button>
                  <button onClick={() => remove(d.id)} className="btn-ghost p-2 text-red-500" aria-label="delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-surface-200/90"
        >
          <span className="text-sm font-medium">{selected.size} {t("devices.selected")}</span>
          <button className="btn-primary px-3 py-1.5" onClick={() => bulkToggle(true)}>
            <Power className="h-4 w-4" /> {t("devices.bulkOn")}
          </button>
          <button className="btn-secondary px-3 py-1.5" onClick={() => bulkToggle(false)}>
            {t("devices.bulkOff")}
          </button>
          <button className="btn-ghost p-2" onClick={() => setSelected(new Set())} aria-label="clear">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
