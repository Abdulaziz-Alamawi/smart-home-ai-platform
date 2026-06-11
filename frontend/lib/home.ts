import {
  AirVent,
  Camera,
  DoorClosed,
  Fan,
  Gauge,
  Lightbulb,
  Lock,
  Plug,
  Radar,
  Refrigerator,
  Speaker,
  Thermometer,
  Tv,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type { Device, Room } from "./types";

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-random helpers (stable per id) so synthesized
 * telemetry is consistent across renders and derived from real data.
 * ------------------------------------------------------------------ */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function rand(seed: string, min: number, max: number): number {
  return min + hashSeed(seed) * (max - min);
}

/* ------------------------------------------------------------------ *
 * Device type metadata
 * ------------------------------------------------------------------ */
export type DeviceCategory =
  | "light"
  | "climate"
  | "security"
  | "sensor"
  | "energy"
  | "media"
  | "appliance"
  | "other";

interface DeviceMeta {
  icon: LucideIcon;
  category: DeviceCategory;
  battery: boolean;
  labelAr: string;
  labelEn: string;
}

const DEVICE_META: Record<string, DeviceMeta> = {
  LIGHT: { icon: Lightbulb, category: "light", battery: false, labelAr: "إضاءة ذكية", labelEn: "Smart Light" },
  SWITCH: { icon: Plug, category: "energy", battery: false, labelAr: "مفتاح ذكي", labelEn: "Smart Switch" },
  PLUG: { icon: Plug, category: "energy", battery: false, labelAr: "قابس ذكي", labelEn: "Smart Plug" },
  THERMOSTAT: { icon: Thermometer, category: "climate", battery: true, labelAr: "ثرموستات", labelEn: "Thermostat" },
  AC: { icon: AirVent, category: "climate", battery: false, labelAr: "مكيّف ذكي", labelEn: "Smart AC" },
  FAN: { icon: Fan, category: "climate", battery: false, labelAr: "مروحة", labelEn: "Smart Fan" },
  LOCK: { icon: Lock, category: "security", battery: true, labelAr: "قفل ذكي", labelEn: "Smart Lock" },
  CAMERA: { icon: Camera, category: "security", battery: true, labelAr: "كاميرا", labelEn: "Camera" },
  MOTION_SENSOR: { icon: Radar, category: "sensor", battery: true, labelAr: "حسّاس حركة", labelEn: "Motion Sensor" },
  DOOR_SENSOR: { icon: DoorClosed, category: "sensor", battery: true, labelAr: "حسّاس باب", labelEn: "Door Sensor" },
  ENERGY_METER: { icon: Gauge, category: "energy", battery: false, labelAr: "عدّاد طاقة", labelEn: "Energy Meter" },
  TV: { icon: Tv, category: "media", battery: false, labelAr: "تلفاز ذكي", labelEn: "Smart TV" },
  SPEAKER: { icon: Speaker, category: "media", battery: false, labelAr: "سمّاعة", labelEn: "Speaker" },
  FRIDGE: { icon: Refrigerator, category: "appliance", battery: false, labelAr: "ثلّاجة", labelEn: "Fridge" },
};

const FALLBACK_META: DeviceMeta = {
  icon: Wifi,
  category: "other",
  battery: false,
  labelAr: "جهاز",
  labelEn: "Device",
};

export function deviceMeta(type: string): DeviceMeta {
  return DEVICE_META[type?.toUpperCase()] ?? FALLBACK_META;
}

/* ------------------------------------------------------------------ *
 * Room archetypes
 * ------------------------------------------------------------------ */
export interface RoomArchetype {
  icon: string; // emoji for floor-plan tiles
  nameAr: string;
  baseTemp: number;
  baseHumidity: number;
}

const ROOM_ARCHETYPES: Record<string, RoomArchetype> = {
  living: { icon: "🛋️", nameAr: "غرفة المعيشة", baseTemp: 23, baseHumidity: 45 },
  bedroom: { icon: "🛏️", nameAr: "غرفة النوم", baseTemp: 22, baseHumidity: 48 },
  kitchen: { icon: "🍳", nameAr: "المطبخ", baseTemp: 25, baseHumidity: 55 },
  bathroom: { icon: "🚿", nameAr: "الحمّام", baseTemp: 24, baseHumidity: 65 },
  garage: { icon: "🚗", nameAr: "الكراج", baseTemp: 19, baseHumidity: 50 },
  garden: { icon: "🌳", nameAr: "الحديقة", baseTemp: 27, baseHumidity: 40 },
  office: { icon: "💻", nameAr: "المكتب", baseTemp: 22, baseHumidity: 44 },
};

const FALLBACK_ARCHETYPE: RoomArchetype = {
  icon: "🏠",
  nameAr: "غرفة",
  baseTemp: 23,
  baseHumidity: 47,
};

export function roomArchetype(name: string): RoomArchetype {
  const n = (name ?? "").toLowerCase();
  if (n.includes("living") || n.includes("معيش") || n.includes("صال")) return ROOM_ARCHETYPES.living;
  if (n.includes("bed") || n.includes("نوم")) return ROOM_ARCHETYPES.bedroom;
  if (n.includes("kitchen") || n.includes("مطبخ")) return ROOM_ARCHETYPES.kitchen;
  if (n.includes("bath") || n.includes("حمام") || n.includes("حمّام")) return ROOM_ARCHETYPES.bathroom;
  if (n.includes("garage") || n.includes("كراج") || n.includes("مرآب")) return ROOM_ARCHETYPES.garage;
  if (n.includes("garden") || n.includes("حديق") || n.includes("yard")) return ROOM_ARCHETYPES.garden;
  if (n.includes("office") || n.includes("مكتب") || n.includes("study")) return ROOM_ARCHETYPES.office;
  return FALLBACK_ARCHETYPE;
}

/* ------------------------------------------------------------------ *
 * Synthesized device telemetry (derived deterministically + live tick)
 * ------------------------------------------------------------------ */
export interface DeviceTelemetry {
  health: number; // 0-100
  battery: number | null; // 0-100 or null if wired
  signal: number; // 0-100
  hasBattery: boolean;
  category: DeviceCategory;
  icon: LucideIcon;
  lastActivityMin: number; // minutes ago
}

export function deviceTelemetry(device: Device, tick = 0): DeviceTelemetry {
  const meta = deviceMeta(device.type);
  const base = device.id + device.type;
  const healthBase = device.status === "ERROR" ? 35 : device.status === "OFFLINE" ? 62 : 88;
  const health = clamp(Math.round(healthBase + rand(base + "h", -6, 9) + Math.sin(tick / 7 + hashSeed(base) * 6) * 2), 0, 100);
  const battery = meta.battery
    ? clamp(Math.round(rand(base + "b", 18, 100) - tick * 0.02), 1, 100)
    : null;
  const signal =
    device.status === "OFFLINE"
      ? 0
      : clamp(Math.round(rand(base + "s", 55, 99) + Math.cos(tick / 9 + hashSeed(base)) * 4), 0, 100);
  const lastActivityMin =
    device.status === "ONLINE" ? Math.round(rand(base + "a", 0, 8)) : Math.round(rand(base + "a", 30, 1440));
  return {
    health,
    battery,
    signal,
    hasBattery: meta.battery,
    category: meta.category,
    icon: meta.icon,
    lastActivityMin,
  };
}

/* ------------------------------------------------------------------ *
 * Synthesized room telemetry (aggregated from its real devices)
 * ------------------------------------------------------------------ */
export interface RoomTelemetry {
  id: string;
  name: string;
  nameAr: string;
  floor: number;
  archetype: RoomArchetype;
  temperature: number;
  humidity: number;
  occupancy: number;
  deviceCount: number;
  onlineCount: number;
  activeCount: number;
  energyKw: number;
  health: number;
}

export function roomTelemetry(room: Room, devices: Device[], tick = 0): RoomTelemetry {
  const arch = roomArchetype(room.name);
  const roomDevices = devices.filter((d) => d.room?.id === room.id);
  const deviceCount = room._count?.devices ?? roomDevices.length;
  const onlineCount = roomDevices.filter((d) => d.status === "ONLINE").length;
  const activeCount = roomDevices.filter((d) => d.isOn).length;
  const energyKw = roomDevices
    .filter((d) => d.isOn)
    .reduce((sum, d) => sum + (d.powerRatingKw ?? 0), 0);

  const seed = room.id + room.name;
  const tempWave = Math.sin(tick / 6 + hashSeed(seed) * 6) * 1.4;
  const humWave = Math.cos(tick / 8 + hashSeed(seed) * 4) * 3;
  const temperature = Number((arch.baseTemp + rand(seed + "t", -1.5, 2.5) + tempWave).toFixed(1));
  const humidity = clamp(Math.round(arch.baseHumidity + rand(seed + "hu", -5, 6) + humWave), 10, 95);
  const occupancy = activeCount > 0 ? Math.max(1, Math.round(rand(seed + "o" + tick, 0, 3))) : Math.round(rand(seed + "o" + tick, 0, 1.4));

  const healthArr = roomDevices.map((d) => deviceTelemetry(d, tick).health);
  const health = healthArr.length
    ? Math.round(healthArr.reduce((a, b) => a + b, 0) / healthArr.length)
    : 100;

  return {
    id: room.id,
    name: room.name,
    nameAr: arch.nameAr,
    floor: room.floor,
    archetype: arch,
    temperature,
    humidity,
    occupancy,
    deviceCount,
    onlineCount,
    activeCount,
    energyKw: Number(energyKw.toFixed(2)),
    health,
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function healthColor(v: number): string {
  if (v >= 80) return "text-emerald-500";
  if (v >= 55) return "text-amber-500";
  return "text-red-500";
}

export function batteryColor(v: number): string {
  if (v >= 50) return "text-emerald-500";
  if (v >= 20) return "text-amber-500";
  return "text-red-500";
}
