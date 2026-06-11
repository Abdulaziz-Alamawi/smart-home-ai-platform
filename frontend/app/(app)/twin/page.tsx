"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Droplets,
  Gauge,
  Power,
  Thermometer,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AnimatedNumber, FadeIn, Ring } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { useHomeData, useTick } from "@/lib/hooks";
import {
  deviceMeta,
  deviceTelemetry,
  healthColor,
  roomTelemetry,
  type RoomTelemetry,
} from "@/lib/home";
import { useI18n } from "@/lib/i18n";
import type { Device } from "@/lib/types";

function metricColor(health: number) {
  if (health >= 80) return "#10b981";
  if (health >= 55) return "#f59e0b";
  return "#ef4444";
}

function RoomTile({
  room,
  onClick,
  index,
  t,
}: {
  room: RoomTelemetry;
  onClick: () => void;
  index: number;
  t: (k: string) => string;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="glass group relative overflow-hidden p-5 text-start transition-shadow hover:shadow-glow"
    >
      <div className="absolute -end-6 -top-6 text-7xl opacity-10 transition group-hover:opacity-20">
        {room.archetype.icon}
      </div>
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-2xl">{room.archetype.icon}</div>
          <h3 className="mt-2 font-semibold">{room.name}</h3>
          <p className="text-xs text-gray-400">
            {room.deviceCount} {t("twin.devices")} · {room.activeCount} {t("overview.activeNow")}
          </p>
        </div>
        <Ring value={room.health} size={52} stroke={5} color={metricColor(room.health)}>
          <span className={`text-xs font-bold ${healthColor(room.health)}`}>{room.health}</span>
        </Ring>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 py-2 dark:bg-white/5">
          <Thermometer className="mx-auto h-4 w-4 text-amber-500" />
          <div className="mt-1 text-sm font-semibold tabular-nums">{room.temperature}°</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2 dark:bg-white/5">
          <Droplets className="mx-auto h-4 w-4 text-brand-500" />
          <div className="mt-1 text-sm font-semibold tabular-nums">{room.humidity}%</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2 dark:bg-white/5">
          <Users className="mx-auto h-4 w-4 text-iris-500" />
          <div className="mt-1 text-sm font-semibold tabular-nums">{room.occupancy}</div>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-emerald-500" /> {room.energyKw} kW
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" /> {t("map.floor")} {room.floor}
        </span>
      </div>
    </motion.button>
  );
}

function RoomDrawer({
  room,
  devices,
  tick,
  onClose,
  onToggle,
}: {
  room: RoomTelemetry;
  devices: Device[];
  tick: number;
  onClose: () => void;
  onToggle: (d: Device) => void;
}) {
  const { t, lang } = useI18n();
  const roomDevices = devices.filter((d) => d.room?.id === room.id);

  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: lang === "ar" ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: lang === "ar" ? "-100%" : "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="absolute inset-y-0 end-0 w-full max-w-md overflow-y-auto glass-strong p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{room.archetype.icon}</span>
            <div>
              <h2 className="text-xl font-bold">{room.name}</h2>
              <p className="text-xs text-gray-400">{t("map.floor")} {room.floor}</p>
            </div>
          </div>
          <button className="btn-ghost p-2" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatBox icon={Thermometer} label={t("twin.temperature")} value={`${room.temperature}°C`} color="text-amber-500" />
          <StatBox icon={Droplets} label={t("twin.humidity")} value={`${room.humidity}%`} color="text-brand-500" />
          <StatBox icon={Users} label={t("twin.occupancy")} value={`${room.occupancy}`} color="text-iris-500" />
          <StatBox icon={Zap} label={t("twin.energy")} value={`${room.energyKw} kW`} color="text-emerald-500" />
        </div>

        <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-500">{t("twin.roomDevices")}</h3>
        <div className="space-y-2">
          {roomDevices.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-white/10">
              {t("page.noData")}
            </p>
          )}
          {roomDevices.map((d) => {
            const tele = deviceTelemetry(d, tick);
            const meta = deviceMeta(d.type);
            const Icon = meta.icon;
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <span className={`rounded-lg p-2 ${d.isOn ? "bg-brand-500/15 text-brand-500" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-gray-400">
                    {lang === "ar" ? meta.labelAr : meta.labelEn} · {t("devices.health")} {tele.health}%
                  </div>
                </div>
                <button
                  onClick={() => onToggle(d)}
                  className={`rounded-lg p-2 transition ${d.isOn ? "bg-emerald-500/15 text-emerald-500" : "bg-gray-100 text-gray-400 dark:bg-white/10"}`}
                  aria-label="toggle"
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </motion.aside>
    </motion.div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
      <Icon className={`h-5 w-5 ${color}`} />
      <div className="mt-2 text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

export default function DigitalTwinPage() {
  const { t } = useI18n();
  const { devices, rooms, loading, reload, setDevices } = useHomeData();
  const tick = useTick(4000);
  const [selected, setSelected] = useState<string | null>(null);

  const telemetry = useMemo(
    () => rooms.map((r) => roomTelemetry(r, devices, tick)),
    [rooms, devices, tick]
  );

  const selectedRoom = telemetry.find((r) => r.id === selected) ?? null;

  const toggleDevice = async (d: Device) => {
    setDevices((prev) => prev.map((x) => (x.id === d.id ? { ...x, isOn: !x.isOn, status: !x.isOn ? "ONLINE" : "OFFLINE" } : x)));
    try {
      const { api } = await import("@/lib/api");
      await api.post(`/devices/${d.id}/toggle`, { isOn: !d.isOn });
    } catch {
      void reload();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight">{t("twin.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("twin.subtitle")}</p>
      </FadeIn>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {telemetry.map((room, i) => (
          <RoomTile key={room.id} room={room} index={i} t={t} onClick={() => setSelected(room.id)} />
        ))}
      </div>

      {telemetry.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-400">{t("twin.selectRoom")}</div>
      )}

      <AnimatePresence>
        {selectedRoom && (
          <RoomDrawer
            room={selectedRoom}
            devices={devices}
            tick={tick}
            onClose={() => setSelected(null)}
            onToggle={toggleDevice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
