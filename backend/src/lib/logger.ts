/* Minimal structured logger (no external dependency). */
type Level = "info" | "warn" | "error" | "debug";

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
  debug: (m: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") log("debug", m, meta);
  },
};
