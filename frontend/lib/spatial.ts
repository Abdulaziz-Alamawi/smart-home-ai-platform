/**
 * Spatial / Digital-Twin abstraction layer.
 *
 * Provides a renderer-agnostic coordinate system for rooms and devices so the
 * current 2D floor-plan and any future 3D engine (three.js / react-three-fiber)
 * can share one source of truth. Coordinates use meters in a right-handed plan
 * space: x → east, y → north, z → up (floor height).
 *
 * Nothing here renders 3D today — it is the architecture that makes 3D a drop-in
 * later: a scene graph (floors → rooms → device anchors) with bounding boxes.
 */

import { roomArchetype } from "./home";
import type { Device, Room } from "./types";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  /** Bottom-south-west corner (meters). */
  origin: Vec3;
  /** Width (x), depth (y), height (z) in meters. */
  size: Vec3;
}

export interface RoomNode {
  id: string;
  name: string;
  floor: number;
  /** Plan-space footprint + ceiling height. */
  box: BoundingBox;
  /** Center point for labels / camera focus. */
  center: Vec3;
  /** Suggested tile color hint (zone). */
  colorHint: string;
  deviceAnchors: DeviceAnchor[];
}

export interface DeviceAnchor {
  id: string;
  name: string;
  type: string;
  /** Position within the scene (meters, absolute plan space). */
  position: Vec3;
  /** Mounting surface hint for a future 3D model. */
  mount: "ceiling" | "wall" | "floor" | "surface";
}

export interface FloorMeta {
  level: number;
  label: string;
  elevation: number; // z base in meters
  height: number; // floor-to-ceiling
  rooms: RoomNode[];
}

export interface SceneGraph {
  units: "meters";
  bounds: BoundingBox;
  floors: FloorMeta[];
}

const FLOOR_HEIGHT = 3; // meters
const ROOM_W = 5;
const ROOM_D = 4;
const GAP = 0.4;
const COLS = 3;

function mountFor(type: string): DeviceAnchor["mount"] {
  const t = type.toUpperCase();
  if (t.includes("LIGHT") || t.includes("MOTION") || t.includes("CAMERA")) return "ceiling";
  if (t.includes("LOCK") || t.includes("DOOR") || t.includes("THERMOSTAT") || t.includes("SWITCH")) return "wall";
  if (t.includes("PLUG") || t.includes("METER")) return "floor";
  return "surface";
}

/**
 * Deterministically lay out rooms on a grid per floor and anchor each device
 * at a stable position inside its room. Pure function — safe for SSR + memoizing.
 */
export function buildSceneGraph(rooms: Room[], devices: Device[]): SceneGraph {
  const byFloor = new Map<number, Room[]>();
  for (const r of rooms) {
    const arr = byFloor.get(r.floor) ?? [];
    arr.push(r);
    byFloor.set(r.floor, arr);
  }

  let maxX = 0;
  let maxY = 0;
  const floors: FloorMeta[] = [];

  for (const [level, floorRooms] of Array.from(byFloor.entries()).sort((a, b) => a[0] - b[0])) {
    const elevation = level * FLOOR_HEIGHT;
    const roomNodes: RoomNode[] = floorRooms.map((room, i) => {
      const col = i % COLS;
      const rowIdx = Math.floor(i / COLS);
      const ox = col * (ROOM_W + GAP);
      const oy = rowIdx * (ROOM_D + GAP);
      maxX = Math.max(maxX, ox + ROOM_W);
      maxY = Math.max(maxY, oy + ROOM_D);

      const box: BoundingBox = {
        origin: { x: ox, y: oy, z: elevation },
        size: { x: ROOM_W, y: ROOM_D, z: FLOOR_HEIGHT },
      };
      const center: Vec3 = { x: ox + ROOM_W / 2, y: oy + ROOM_D / 2, z: elevation + FLOOR_HEIGHT / 2 };

      const roomDevices = devices.filter((d) => d.room?.id === room.id);
      const deviceAnchors: DeviceAnchor[] = roomDevices.map((d, di) => {
        // Stable scatter inside the room footprint (golden-angle spiral).
        const angle = di * 2.399963;
        const radius = 0.4 + (di % 4) * 0.5;
        const mount = mountFor(d.type);
        const z = mount === "ceiling" ? elevation + FLOOR_HEIGHT - 0.2 : mount === "wall" ? elevation + 1.4 : elevation + 0.1;
        return {
          id: d.id,
          name: d.name,
          type: d.type,
          mount,
          position: {
            x: Number((center.x + Math.cos(angle) * radius).toFixed(2)),
            y: Number((center.y + Math.sin(angle) * radius).toFixed(2)),
            z: Number(z.toFixed(2)),
          },
        };
      });

      return {
        id: room.id,
        name: room.name,
        floor: level,
        box,
        center,
        colorHint: roomArchetype(room.name).icon,
        deviceAnchors,
      };
    });

    floors.push({
      level,
      label: level === 0 ? "Ground Floor" : `Floor ${level}`,
      elevation,
      height: FLOOR_HEIGHT,
      rooms: roomNodes,
    });
  }

  return {
    units: "meters",
    bounds: { origin: { x: 0, y: 0, z: 0 }, size: { x: maxX, y: maxY, z: (floors.length || 1) * FLOOR_HEIGHT } },
    floors,
  };
}

/** Flatten all device anchors across the scene (useful for 3D instancing). */
export function allAnchors(scene: SceneGraph): DeviceAnchor[] {
  return scene.floors.flatMap((f) => f.rooms.flatMap((r) => r.deviceAnchors));
}
