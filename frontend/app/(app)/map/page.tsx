"use client";

import { motion } from "framer-motion";
import { Droplets, Thermometer, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import { FadeIn } from "@/components/primitives";
import { PageLoader } from "@/components/ui";
import { roomTelemetry, type RoomTelemetry } from "@/lib/home";
import { useHomeData, useTick } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";

function tempZone(temp: number): { bg: string; ring: string; label: string } {
  if (temp >= 26) return { bg: "from-red-500/25 to-orange-500/10", ring: "ring-red-500/40", label: "warm" };
  if (temp >= 23) return { bg: "from-amber-400/20 to-amber-500/5", ring: "ring-amber-400/40", label: "mild" };
  if (temp >= 20) return { bg: "from-emerald-400/20 to-emerald-500/5", ring: "ring-emerald-400/40", label: "comfort" };
  return { bg: "from-brand-400/25 to-brand-500/10", ring: "ring-brand-400/40", label: "cool" };
}

export default function HomeMapPage() {
  const { t } = useI18n();
  const { devices, rooms, loading } = useHomeData();
  const tick = useTick(4000);
  const [active, setActive] = useState<string | null>(null);

  const telemetry = useMemo(() => rooms.map((r) => roomTelemetry(r, devices, tick)), [rooms, devices, tick]);

  const byFloor = useMemo(() => {
    const map = new Map<number, RoomTelemetry[]>();
    for (const r of telemetry) {
      const arr = map.get(r.floor) ?? [];
      arr.push(r);
      map.set(r.floor, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [telemetry]);

  const activeRoom = telemetry.find((r) => r.id === active) ?? null;

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight">{t("map.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("map.subtitle")}</p>
      </FadeIn>

      {/* Temperature zone legend */}
      <FadeIn delay={0.05} className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="font-medium">{t("map.zones")}:</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-400" /> &lt;20°</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-400" /> 20–23°</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400" /> 23–26°</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> &gt;26°</span>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Blueprint */}
        <div className="space-y-6">
          {byFloor.map(([floor, roomsOnFloor], fi) => (
            <FadeIn key={floor} delay={0.05 * fi}>
              <div className="glass p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-500">
                    {t("map.floor")} {floor}
                  </span>
                  <span className="text-xs text-gray-400">{roomsOnFloor.length} {t("twin.devices")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {roomsOnFloor.map((r) => {
                    const zone = tempZone(r.temperature);
                    const sel = active === r.id;
                    return (
                      <motion.button
                        key={r.id}
                        onClick={() => setActive(r.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative aspect-square rounded-2xl bg-gradient-to-br ${zone.bg} p-3 text-start ring-1 ${zone.ring} ${sel ? "ring-2 ring-brand-500" : ""}`}
                      >
                        <div className="text-2xl">{r.archetype.icon}</div>
                        <div className="mt-1 truncate text-sm font-semibold">{r.name}</div>
                        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-xs">
                          <span className="font-bold tabular-nums">{r.temperature}°</span>
                          {r.occupancy > 0 && (
                            <span className="flex items-center gap-0.5 text-iris-500">
                              <Users className="h-3 w-3" /> {r.occupancy}
                            </span>
                          )}
                        </div>
                        {r.health < 55 && (
                          <span className="absolute end-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          ))}
          {byFloor.length === 0 && (
            <div className="glass p-12 text-center text-sm text-gray-400">{t("page.noData")}</div>
          )}
        </div>

        {/* Inspector */}
        <FadeIn delay={0.1}>
          <div className="glass sticky top-4 p-5">
            {activeRoom ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{activeRoom.archetype.icon}</span>
                  <div>
                    <h3 className="font-bold">{activeRoom.name}</h3>
                    <p className="text-xs text-gray-400">{t("map.floor")} {activeRoom.floor}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <Row icon={Thermometer} color="text-amber-500" label={t("twin.temperature")} value={`${activeRoom.temperature}°C`} />
                  <Row icon={Droplets} color="text-brand-500" label={t("twin.humidity")} value={`${activeRoom.humidity}%`} />
                  <Row icon={Users} color="text-iris-500" label={t("twin.occupancy")} value={`${activeRoom.occupancy} ${t("twin.people")}`} />
                  <Row icon={Zap} color="text-emerald-500" label={t("twin.energy")} value={`${activeRoom.energyKw} kW`} />
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{t("twin.health")}</span>
                    <span className="font-bold">{activeRoom.health}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${activeRoom.health >= 80 ? "bg-emerald-500" : activeRoom.health >= 55 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${activeRoom.health}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-gray-400">{t("twin.selectRoom")}</div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10">
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className={`h-4 w-4 ${color}`} /> {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
