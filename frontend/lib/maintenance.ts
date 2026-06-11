/**
 * Predictive maintenance layer.
 *
 * Estimates device lifespan, failure probability, risk and a suggested service
 * date from device telemetry. Values are deterministic per-device (seeded by id)
 * and react to live health/battery, so the Maintenance Center is stable yet
 * responds to the IoT simulation.
 */

import { deviceMeta, deviceTelemetry, hashSeed } from "./home";
import type { Device } from "./types";

/** Expected service life (years) by device category. */
const LIFESPAN_YEARS: Record<string, number> = {
  light: 6,
  climate: 12,
  security: 8,
  sensor: 4,
  energy: 15,
  media: 7,
  appliance: 10,
  other: 8,
};

export type RiskLevel = "healthy" | "atRisk" | "critical";

export interface MaintenanceReport {
  device: Device;
  ageMonths: number;
  lifespanMonths: number;
  remainingMonths: number;
  failureProbability: number; // 0-100
  risk: RiskLevel;
  health: number;
  battery: number | null;
  serviceInDays: number;
  recommendationKey: "replace" | "service" | "battery" | "monitor" | "ok";
}

export function maintenanceReport(device: Device, tick = 0): MaintenanceReport {
  const meta = deviceMeta(device.type);
  const tele = deviceTelemetry(device, tick);
  const seed = device.id + device.type;

  const lifespanMonths = (LIFESPAN_YEARS[meta.category] ?? 8) * 12;
  // Stable "installed age" between 5% and 95% of lifespan.
  const ageMonths = Math.round((0.05 + hashSeed(seed + "age") * 0.9) * lifespanMonths);
  const ageRatio = ageMonths / lifespanMonths;

  // Failure probability rises with age, low health and low battery.
  const healthPenalty = (100 - tele.health) * 0.5;
  const batteryPenalty = tele.battery != null ? Math.max(0, (30 - tele.battery)) * 0.8 : 0;
  const agePenalty = ageRatio * 45;
  const statusPenalty = device.status === "ERROR" ? 25 : device.status === "OFFLINE" ? 10 : 0;
  const failureProbability = Math.max(
    1,
    Math.min(99, Math.round(agePenalty + healthPenalty + batteryPenalty + statusPenalty))
  );

  // Remaining life shrinks with failure probability.
  const remainingMonths = Math.max(0, Math.round(lifespanMonths * (1 - ageRatio) * (1 - failureProbability / 140)));

  const risk: RiskLevel = failureProbability >= 65 ? "critical" : failureProbability >= 38 ? "atRisk" : "healthy";

  const serviceInDays =
    risk === "critical" ? Math.round(3 + hashSeed(seed + "s") * 7)
    : risk === "atRisk" ? Math.round(14 + hashSeed(seed + "s") * 30)
    : Math.round(120 + hashSeed(seed + "s") * 120);

  let recommendationKey: MaintenanceReport["recommendationKey"] = "ok";
  if (tele.battery != null && tele.battery < 20) recommendationKey = "battery";
  else if (failureProbability >= 65) recommendationKey = "replace";
  else if (failureProbability >= 38) recommendationKey = "service";
  else if (tele.health < 70) recommendationKey = "monitor";

  return {
    device,
    ageMonths,
    lifespanMonths,
    remainingMonths,
    failureProbability,
    risk,
    health: tele.health,
    battery: tele.battery,
    serviceInDays,
    recommendationKey,
  };
}

export function riskColor(risk: RiskLevel): string {
  return risk === "critical" ? "#ef4444" : risk === "atRisk" ? "#f59e0b" : "#10b981";
}

export const RECOMMENDATION_TEXT: Record<string, { ar: string; en: string }> = {
  replace: { ar: "يُنصح بالاستبدال قريبًا — احتمال فشل مرتفع", en: "Replacement advised soon — high failure risk" },
  service: { ar: "جدولة صيانة وقائية", en: "Schedule preventive service" },
  battery: { ar: "استبدال البطارية مطلوب", en: "Battery replacement required" },
  monitor: { ar: "مراقبة الأداء عن كثب", en: "Monitor performance closely" },
  ok: { ar: "لا إجراء مطلوب", en: "No action required" },
};
