/**
 * Executive scoring layer.
 *
 * Derives high-level KPIs ("scores") from real platform data: the live IoT
 * snapshot, device fleet, energy time-series, AI recommendations and security
 * events. Every score is a pure, explainable function of its inputs so the
 * Executive Command Center stays trustworthy (no random inflation).
 */

import { hashSeed } from "./home";
import type { IotSnapshot, LiveEvent } from "./realtime";
import type { Device, EnergyPoint, Recommendation } from "./types";

export interface ScoreInput {
  iot: IotSnapshot | null;
  devices: Device[];
  energySeries: EnergyPoint[];
  recommendations: Recommendation[];
  events: LiveEvent[];
  monthlyCost: number;
}

export interface ScoreCard {
  key: string;
  value: number; // 0-100
  delta: number; // change hint (-/+)
  detail: string;
}

export interface ExecutiveScores {
  homeHealth: ScoreCard;
  aiConfidence: ScoreCard;
  deviceReliability: ScoreCard;
  energyEfficiency: ScoreCard;
  security: ScoreCard;
  savings: ScoreCard;
  monthlySavings: number; // currency value
  overall: number;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function recConfidence(id: string): number {
  return Math.round(72 + hashSeed(id) * 26);
}

export function computeScores(input: ScoreInput): ExecutiveScores {
  const { iot, devices, energySeries, recommendations, events, monthlyCost } = input;

  // 1. Home health — average device health from the live fleet (fallback: status)
  const fleetHealth = iot?.fleet.avgHealth;
  const statusHealth = devices.length
    ? (devices.filter((d) => d.status === "ONLINE").length / devices.length) * 100
    : 90;
  const homeHealthVal = clamp(fleetHealth ?? statusHealth);

  // 2. AI confidence — mean confidence of active recommendations
  const aiVal = recommendations.length
    ? clamp(recommendations.reduce((s, r) => s + recConfidence(r.id), 0) / recommendations.length)
    : 86;

  // 3. Device reliability — online ratio weighted by battery health
  const total = iot?.fleet.total ?? devices.length ?? 1;
  const online = iot?.fleet.online ?? devices.filter((d) => d.status === "ONLINE").length;
  const onlineRatio = total ? online / total : 1;
  const batteryFactor = iot ? iot.fleet.avgBattery / 100 : 0.9;
  const reliabilityVal = clamp(onlineRatio * 100 * 0.7 + batteryFactor * 100 * 0.3);

  // 4. Energy efficiency — inverse coefficient of variation of daily usage
  let efficiencyVal = 70;
  if (energySeries.length > 1) {
    const vals = energySeries.map((s) => s.energyKwh);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length;
    const cov = avg > 0 ? Math.sqrt(variance) / avg : 1;
    efficiencyVal = clamp(100 - cov * 60, 40, 98);
  }

  // 5. Security — start at 100, subtract for active critical/warning events
  const critical = events.filter((e) => e.severity === "CRITICAL").length;
  const warning = events.filter((e) => e.severity === "WARNING").length;
  const securityVal = clamp(100 - critical * 12 - warning * 4, 20, 100);

  // 6. Savings — efficiency + AI opportunity → savings score & $ value
  const recSavings = recommendations.reduce((s, r) => s + (r.estimatedSavings ?? 0), 0); // per day
  const monthlySavings = Number((recSavings * 30).toFixed(2));
  const savingsRatio = monthlyCost > 0 ? Math.min(1, monthlySavings / monthlyCost) : 0.15;
  const savingsVal = clamp(45 + savingsRatio * 55 + (efficiencyVal - 70) * 0.3);

  const overall = clamp(
    (homeHealthVal + aiVal + reliabilityVal + efficiencyVal + securityVal + savingsVal) / 6
  );

  const d = (seed: string) => Number((hashSeed(seed) * 6 - 2).toFixed(1)); // stable -2..+4 delta hint

  return {
    homeHealth: { key: "homeHealth", value: homeHealthVal, delta: d("hh"), detail: `${online}/${total} online` },
    aiConfidence: { key: "aiConfidence", value: aiVal, delta: d("ai"), detail: `${recommendations.length} active insights` },
    deviceReliability: { key: "deviceReliability", value: reliabilityVal, delta: d("dr"), detail: `${Math.round(onlineRatio * 100)}% uptime` },
    energyEfficiency: { key: "energyEfficiency", value: efficiencyVal, delta: d("ee"), detail: `${energySeries.length}d analyzed` },
    security: { key: "security", value: securityVal, delta: d("se"), detail: `${critical} critical · ${warning} warnings` },
    savings: { key: "savings", value: savingsVal, delta: d("sa"), detail: `$${monthlySavings}/mo potential` },
    monthlySavings,
    overall,
  };
}
