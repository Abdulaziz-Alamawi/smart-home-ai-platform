/**
 * Advanced IoT Simulation Engine.
 *
 * Maintains a stateful fleet of virtual smart-home devices and continuously
 * evolves realistic telemetry: online/offline transitions, battery drain,
 * sensor updates, occupancy/temperature/humidity drift and energy consumption.
 *
 * This is a self-contained domain simulation (no DB writes) that powers the
 * real-time dashboards. It is deterministic in structure but stochastic in
 * evolution, so the UI shows lifelike, ever-changing smart-home behavior.
 */

export type SimDeviceType =
  | "LIGHT"
  | "THERMOSTAT"
  | "AC"
  | "LOCK"
  | "CAMERA"
  | "MOTION_SENSOR"
  | "DOOR_SENSOR"
  | "PLUG"
  | "ENERGY_METER";

export interface SimDevice {
  id: string;
  name: string;
  type: SimDeviceType;
  room: string;
  online: boolean;
  isOn: boolean;
  batteryPowered: boolean;
  battery: number; // 0-100 (100 if wired)
  signal: number; // 0-100
  powerKw: number;
  health: number; // 0-100
  lastChange: string; // ISO
}

export interface SimRoom {
  name: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  co2: number;
}

export interface SimEvent {
  id: string;
  ts: string;
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  deviceId?: string;
  room?: string;
}

export interface SimSnapshot {
  ts: string;
  tick: number;
  devices: SimDevice[];
  rooms: SimRoom[];
  fleet: {
    total: number;
    online: number;
    offline: number;
    active: number;
    avgHealth: number;
    avgBattery: number;
    lowBattery: number;
  };
  power: { gridKw: number; solarKw: number; netKw: number };
}

const ROOMS = [
  { name: "Living Room", baseTemp: 23, baseHum: 45 },
  { name: "Bedroom", baseTemp: 22, baseHum: 48 },
  { name: "Kitchen", baseTemp: 25, baseHum: 55 },
  { name: "Bathroom", baseTemp: 24, baseHum: 65 },
  { name: "Garage", baseTemp: 19, baseHum: 50 },
  { name: "Garden", baseTemp: 27, baseHum: 40 },
  { name: "Office", baseTemp: 22, baseHum: 44 },
];

const DEVICE_BLUEPRINT: Array<{ type: SimDeviceType; name: string; room: string; battery: boolean; powerKw: number }> = [
  { type: "LIGHT", name: "Living Room Lights", room: "Living Room", battery: false, powerKw: 0.06 },
  { type: "THERMOSTAT", name: "Living Room Thermostat", room: "Living Room", battery: true, powerKw: 0.01 },
  { type: "CAMERA", name: "Living Room Camera", room: "Living Room", battery: true, powerKw: 0.05 },
  { type: "MOTION_SENSOR", name: "Living Room Motion", room: "Living Room", battery: true, powerKw: 0.005 },
  { type: "LIGHT", name: "Bedroom Lights", room: "Bedroom", battery: false, powerKw: 0.05 },
  { type: "AC", name: "Bedroom AC", room: "Bedroom", battery: false, powerKw: 1.4 },
  { type: "MOTION_SENSOR", name: "Bedroom Motion", room: "Bedroom", battery: true, powerKw: 0.005 },
  { type: "PLUG", name: "Kitchen Fridge Plug", room: "Kitchen", battery: false, powerKw: 0.35 },
  { type: "ENERGY_METER", name: "Kitchen Meter", room: "Kitchen", battery: false, powerKw: 0.01 },
  { type: "LIGHT", name: "Kitchen Lights", room: "Kitchen", battery: false, powerKw: 0.07 },
  { type: "DOOR_SENSOR", name: "Bathroom Door", room: "Bathroom", battery: true, powerKw: 0.004 },
  { type: "LOCK", name: "Garage Lock", room: "Garage", battery: true, powerKw: 0.01 },
  { type: "CAMERA", name: "Garage Camera", room: "Garage", battery: false, powerKw: 0.06 },
  { type: "DOOR_SENSOR", name: "Garage Door", room: "Garage", battery: true, powerKw: 0.004 },
  { type: "MOTION_SENSOR", name: "Garden Motion", room: "Garden", battery: true, powerKw: 0.005 },
  { type: "CAMERA", name: "Garden Camera", room: "Garden", battery: true, powerKw: 0.05 },
  { type: "LIGHT", name: "Office Lights", room: "Office", battery: false, powerKw: 0.06 },
  { type: "PLUG", name: "Office Workstation", room: "Office", battery: false, powerKw: 0.45 },
  { type: "LOCK", name: "Front Door Lock", room: "Living Room", battery: true, powerKw: 0.01 },
  { type: "MOTION_SENSOR", name: "Office Motion", room: "Office", battery: true, powerKw: 0.005 },
];

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export class IoTSimulator {
  private devices: SimDevice[] = [];
  private rooms: Map<string, SimRoom> = new Map();
  private tick = 0;
  private recentEvents: SimEvent[] = [];

  constructor() {
    this.devices = DEVICE_BLUEPRINT.map((b, i) => ({
      id: `sim-${i + 1}`,
      name: b.name,
      type: b.type,
      room: b.room,
      online: true,
      isOn: b.type === "ENERGY_METER" || b.type === "PLUG" || Math.random() > 0.45,
      batteryPowered: b.battery,
      battery: b.battery ? Math.round(rnd(35, 100)) : 100,
      signal: Math.round(rnd(70, 99)),
      powerKw: b.powerKw,
      health: Math.round(rnd(82, 99)),
      lastChange: new Date().toISOString(),
    }));
    for (const r of ROOMS) {
      this.rooms.set(r.name, {
        name: r.name,
        temperature: Number((r.baseTemp + rnd(-1, 1)).toFixed(1)),
        humidity: Math.round(r.baseHum + rnd(-4, 4)),
        occupancy: Math.random() > 0.6 ? Math.round(rnd(1, 3)) : 0,
        co2: Math.round(rnd(420, 600)),
      });
    }
  }

  private pushEvent(e: Omit<SimEvent, "id" | "ts">): void {
    const ev: SimEvent = { id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ts: new Date().toISOString(), ...e };
    this.recentEvents = [ev, ...this.recentEvents].slice(0, 50);
  }

  /** Evolve the whole fleet one step and return any events generated this step. */
  step(): SimEvent[] {
    this.tick += 1;
    const now = new Date().toISOString();
    const generated: SimEvent[] = [];
    const emit = (e: Omit<SimEvent, "id" | "ts">) => {
      const ev: SimEvent = { id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ts: now, ...e };
      generated.push(ev);
      this.recentEvents = [ev, ...this.recentEvents].slice(0, 50);
    };

    // Evolve rooms (temperature/humidity/occupancy drift)
    for (const r of ROOMS) {
      const room = this.rooms.get(r.name)!;
      room.temperature = Number(clamp(room.temperature + rnd(-0.4, 0.4), r.baseTemp - 4, r.baseTemp + 5).toFixed(1));
      room.humidity = Math.round(clamp(room.humidity + rnd(-1.5, 1.5), 15, 95));
      room.co2 = Math.round(clamp(room.co2 + rnd(-25, 25), 380, 1200));
      // Occupancy changes
      if (Math.random() < 0.12) {
        const before = room.occupancy;
        room.occupancy = clamp(room.occupancy + (Math.random() > 0.5 ? 1 : -1), 0, 5);
        if (room.occupancy > before) emit({ type: "OCCUPANCY", severity: "INFO", title: `Movement detected in ${r.name}`, room: r.name });
      }
      // Temperature anomaly
      if (room.temperature > r.baseTemp + 4 && Math.random() < 0.2) {
        emit({ type: "TEMPERATURE", severity: "WARNING", title: `High temperature in ${r.name} (${room.temperature}°C)`, room: r.name });
      }
    }

    // Evolve devices
    for (const d of this.devices) {
      // Online/offline transitions (rare)
      if (Math.random() < 0.02) {
        d.online = !d.online;
        d.lastChange = now;
        d.signal = d.online ? Math.round(rnd(60, 99)) : 0;
        emit({
          type: "DEVICE",
          severity: d.online ? "INFO" : "WARNING",
          title: `${d.name} went ${d.online ? "online" : "offline"}`,
          deviceId: d.id,
          room: d.room,
        });
      }
      if (!d.online) continue;

      // Signal jitter
      d.signal = Math.round(clamp(d.signal + rnd(-5, 5), 20, 100));

      // Battery drain (battery-powered only)
      if (d.batteryPowered) {
        const drain = d.isOn ? rnd(0.04, 0.14) : rnd(0.01, 0.05);
        const before = d.battery;
        d.battery = Number(clamp(d.battery - drain, 0, 100).toFixed(2));
        if (before > 20 && d.battery <= 20) {
          emit({ type: "DEVICE", severity: "WARNING", title: `Low battery on ${d.name} (${Math.round(d.battery)}%)`, deviceId: d.id, room: d.room });
        }
        if (before > 5 && d.battery <= 5) {
          emit({ type: "DEVICE", severity: "CRITICAL", title: `Critical battery on ${d.name}`, deviceId: d.id, room: d.room });
        }
        if (d.battery <= 0.5) d.battery = Number(rnd(95, 100).toFixed(2)); // simulate replacement
      }

      // Health drift
      d.health = Math.round(clamp(d.health + rnd(-1.2, 0.8), 20, 100));
      if (d.health < 45 && Math.random() < 0.05) {
        emit({ type: "DEVICE", severity: "WARNING", title: `${d.name} health degraded (${d.health}%)`, deviceId: d.id, room: d.room });
      }

      // Security: door/lock/camera intrusion-like events
      if ((d.type === "DOOR_SENSOR" || d.type === "LOCK") && Math.random() < 0.015) {
        emit({ type: "SECURITY", severity: "CRITICAL", title: `Unauthorized access attempt at ${d.name}`, deviceId: d.id, room: d.room });
      }
      if (d.type === "MOTION_SENSOR" && d.isOn && Math.random() < 0.05) {
        emit({ type: "MOTION", severity: "INFO", title: `Motion detected by ${d.name}`, deviceId: d.id, room: d.room });
      }

      // Random on/off toggles for actuators
      if ((d.type === "LIGHT" || d.type === "AC" || d.type === "PLUG") && Math.random() < 0.04) {
        d.isOn = !d.isOn;
        d.lastChange = now;
      }
    }

    return generated;
  }

  snapshot(): SimSnapshot {
    const online = this.devices.filter((d) => d.online);
    const batteryDevices = this.devices.filter((d) => d.batteryPowered);
    const activePowerKw = this.devices
      .filter((d) => d.online && d.isOn)
      .reduce((s, d) => s + d.powerKw, 0);
    const hour = new Date().getHours();
    const solarKw = hour > 6 && hour < 19 ? Number(rnd(0.4, 3.2).toFixed(2)) : 0;
    const gridKw = Number((activePowerKw + rnd(0.3, 1.2)).toFixed(2));

    return {
      ts: new Date().toISOString(),
      tick: this.tick,
      devices: this.devices,
      rooms: Array.from(this.rooms.values()),
      fleet: {
        total: this.devices.length,
        online: online.length,
        offline: this.devices.length - online.length,
        active: this.devices.filter((d) => d.online && d.isOn).length,
        avgHealth: Math.round(this.devices.reduce((s, d) => s + d.health, 0) / this.devices.length),
        avgBattery: batteryDevices.length
          ? Math.round(batteryDevices.reduce((s, d) => s + d.battery, 0) / batteryDevices.length)
          : 100,
        lowBattery: batteryDevices.filter((d) => d.battery <= 20).length,
      },
      power: {
        gridKw,
        solarKw,
        netKw: Number(Math.max(0, gridKw - solarKw).toFixed(2)),
      },
    };
  }

  getRecentEvents(): SimEvent[] {
    return this.recentEvents;
  }
}
