export const LATTICE_SIZE = {
  min: 4,
  max: 64,
  defaultWidth: 16,
  defaultHeight: 16,
} as const;

export function clampLatticeSize(
  value: number,
  fallback: number = LATTICE_SIZE.defaultWidth,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(LATTICE_SIZE.max, Math.max(LATTICE_SIZE.min, Math.round(value)));
}

export function latticeSiteCount(width: number, height: number): number {
  return width * height;
}
