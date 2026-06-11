import { env } from "../config/env";
import { logger } from "./logger";

/**
 * Thin HTTP client for the Python AI engine. Uses the global fetch available
 * in Node 18+. Falls back gracefully if the engine is unreachable.
 */
async function call<T>(path: string, body: unknown): Promise<T> {
  const url = `${env.aiEngineUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI engine ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.error("AI engine call failed", { path, error: (err as Error).message });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export interface EnergyForecast {
  horizon: number;
  total_predicted_kwh: number;
  forecast: { hour_offset: number; hour_of_day: number; predicted_kwh: number }[];
}

export interface AnomalyResponse {
  count: number;
  anomalies_detected: number;
  results: { index: number; is_anomaly: boolean; anomaly_score: number }[];
}

export const aiClient = {
  health: async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`${env.aiEngineUrl}/health`, { signal: controller.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  },
  predictEnergy: (body: Record<string, unknown>) =>
    call<EnergyForecast>("/ai/energy/predict", body),
  detectAnomalies: (readings: unknown[]) =>
    call<AnomalyResponse>("/ai/anomaly/detect", { readings }),
  analyzeUsage: (readings: unknown[]) => call<Record<string, unknown>>("/ai/usage/analyze", { readings }),
  optimizeSchedule: (body: Record<string, unknown>) =>
    call<Record<string, unknown>>("/ai/schedule/optimize", body),
  optimizeCost: (body: Record<string, unknown>) =>
    call<Record<string, unknown>>("/ai/cost/optimize", body),
  recommendations: (body: Record<string, unknown>) =>
    call<Record<string, unknown>>("/ai/recommendations", body),
};
