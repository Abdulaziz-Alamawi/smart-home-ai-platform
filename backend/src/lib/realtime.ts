import type { Server as HttpServer } from "http";

import { Server as SocketServer } from "socket.io";

import { env } from "../config/env";
import { logger } from "./logger";
import { IoTSimulator } from "./iotSimulator";

/**
 * Real-time gateway powered by the advanced IoT Simulation Engine.
 *
 * Attaches a Socket.IO server to the existing HTTP server and continuously
 * broadcasts lifelike smart-home telemetry derived from a stateful virtual
 * device fleet:
 *   - `telemetry`  : aggregate power/occupancy heartbeat (every 3s)
 *   - `event`      : discrete smart-home events (device, security, sensor…)
 *   - `iot`        : full fleet + room snapshot (every 3s)
 *
 * Kept intentionally out of the Express `app` so unit/integration tests that
 * import `createApp()` are unaffected.
 */

let io: SocketServer | null = null;
const simulator = new IoTSimulator();

export function initRealtime(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info("Realtime client connected", { id: socket.id });
    // Send an immediate snapshot so the UI is populated on connect
    socket.emit("hello", { ts: new Date().toISOString(), message: "connected" });
    socket.emit("iot", simulator.snapshot());
    socket.on("disconnect", () => {
      logger.info("Realtime client disconnected", { id: socket.id });
    });
  });

  // Simulation heartbeat — every 3s: evolve the fleet, broadcast snapshot + events
  const simTimer = setInterval(() => {
    if (!io) return;
    const events = simulator.step();
    const snap = simulator.snapshot();

    io.emit("iot", snap);
    io.emit("telemetry", {
      ts: snap.ts,
      tick: snap.tick,
      gridKw: snap.power.gridKw,
      solarKw: snap.power.solarKw,
      netKw: snap.power.netKw,
      occupancy: snap.rooms.reduce((s, r) => s + r.occupancy, 0),
      co2: Math.round(snap.rooms.reduce((s, r) => s + r.co2, 0) / snap.rooms.length),
      indoorTemp: Number((snap.rooms.reduce((s, r) => s + r.temperature, 0) / snap.rooms.length).toFixed(1)),
    });

    for (const e of events) {
      io.emit("event", { id: e.id, ts: e.ts, type: e.type, severity: e.severity, title: e.title });
    }
  }, 3000);

  const cleanup = () => clearInterval(simTimer);
  io.on("close", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);

  logger.info("Realtime gateway initialized (Socket.IO + IoT Simulation Engine)");
  return io;
}

export function getIo(): SocketServer | null {
  return io;
}

export function getSimulatorSnapshot() {
  return simulator.snapshot();
}
