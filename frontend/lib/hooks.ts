"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "./api";
import type { ApiData, ApiList, Device, Room } from "./types";

/** Loads the user's rooms + devices (real data from the backend). */
export function useHomeData() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [dev, rms] = await Promise.all([
        api.get<ApiList<Device>>("/devices?pageSize=200"),
        api.get<ApiData<Room[]>>("/rooms"),
      ]);
      setDevices(dev.items ?? []);
      setRooms(rms.data ?? []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { devices, rooms, loading, error, reload, setDevices };
}

/** A monotonically increasing tick used to animate synthesized telemetry. */
export function useTick(intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [intervalMs]);
  return tick;
}
