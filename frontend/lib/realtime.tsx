"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

export interface Telemetry {
  ts: string;
  tick: number;
  gridKw: number;
  solarKw: number;
  netKw: number;
  occupancy: number;
  co2: number;
  indoorTemp: number;
}

export interface LiveEvent {
  id: string;
  ts: string;
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  title: string;
}

export interface SimDevice {
  id: string;
  name: string;
  type: string;
  room: string;
  online: boolean;
  isOn: boolean;
  batteryPowered: boolean;
  battery: number;
  signal: number;
  powerKw: number;
  health: number;
  lastChange: string;
}

export interface SimRoom {
  name: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  co2: number;
}

export interface IotSnapshot {
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

interface RealtimeContextValue {
  connected: boolean;
  telemetry: Telemetry | null;
  events: LiveEvent[];
  iot: IotSnapshot | null;
  clearEvents: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

function socketBaseUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api/v1";
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:4010";
  }
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [iot, setIot] = useState<IotSnapshot | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(socketBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("telemetry", (t: Telemetry) => setTelemetry(t));
    socket.on("iot", (s: IotSnapshot) => setIot(s));
    socket.on("event", (e: LiveEvent) => {
      setEvents((prev) => [e, ...prev].slice(0, 40));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({ connected, telemetry, events, iot, clearEvents: () => setEvents([]) }),
    [connected, telemetry, events, iot]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}
