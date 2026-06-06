import type { GeometryInstance } from "../sim/geometry/types";

export interface OrbitView {
  yaw: number;
  pitch: number;
}

export interface ProjectedSite {
  site: number;
  screenX: number;
  screenY: number;
  depth: number;
}

export const DEFAULT_ORBIT_VIEW: OrbitView = {
  yaw: 0.85,
  pitch: 0.55,
};

export function clampOrbitPitch(pitch: number): number {
  const limit = Math.PI / 2 - 0.08;
  return Math.min(limit, Math.max(-limit, pitch));
}

export function rotatePoint(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
): readonly [number, number, number] {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const xYaw = x * cosYaw + z * sinYaw;
  const zYaw = -x * sinYaw + z * cosYaw;
  const yYaw = y;

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const yPitch = yYaw * cosPitch - zYaw * sinPitch;
  const zPitch = yYaw * sinPitch + zYaw * cosPitch;

  return [xYaw, yPitch, zPitch];
}

export function projectLatticeSites(
  layout: GeometryInstance,
  orbit: OrbitView,
): ProjectedSite[] {
  const [width, height, depth] = layout.dimensions;
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const centerZ = (depth - 1) / 2;
  const projected: ProjectedSite[] = [];

  for (let site = 0; site < layout.numSites(); site += 1) {
    const [x, y, z] = layout.indexToCoord(site);
    const [rx, ry, rz] = rotatePoint(
      x - centerX,
      y - centerY,
      z - centerZ,
      orbit.yaw,
      orbit.pitch,
    );

    projected.push({
      site,
      screenX: rx,
      screenY: -ry,
      depth: rz,
    });
  }

  projected.sort((left, right) => left.depth - right.depth);
  return projected;
}

export interface OrbitLayoutMetrics {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  spanX: number;
  spanY: number;
}

export function orbitLayoutMetrics(projected: readonly ProjectedSite[]): OrbitLayoutMetrics {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of projected) {
    minX = Math.min(minX, point.screenX);
    maxX = Math.max(maxX, point.screenX);
    minY = Math.min(minY, point.screenY);
    maxY = Math.max(maxY, point.screenY);
  }

  if (projected.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, spanX: 1, spanY: 1 };
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    spanX: Math.max(maxX - minX, 1),
    spanY: Math.max(maxY - minY, 1),
  };
}
