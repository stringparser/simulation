import { SimulationError } from "../sim/errors";

export const LATTICE_SIZE = {
  min: 4,
  max: 64,
  maxVolume: 32768,
  defaultWidth: 16,
  defaultHeight: 16,
  defaultDepth: 8,
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

export function latticeSiteCount(width: number, height: number, depth = 1): number {
  return width * height * depth;
}

export function latticeVolume(dimensions: readonly number[]): number {
  return dimensions.reduce((product, dimension) => product * dimension, 1);
}

export function validateDimensions(dimensions: readonly number[]): void {
  if (dimensions.length === 0) {
    throw SimulationError.invalidLatticeSize(0, 0);
  }

  for (const dimension of dimensions) {
    if (
      !Number.isFinite(dimension) ||
      dimension < LATTICE_SIZE.min ||
      dimension > LATTICE_SIZE.max
    ) {
      throw SimulationError.invalidLatticeSize(
        dimensions[0] ?? dimension,
        dimensions[1] ?? dimension,
      );
    }
  }

  const volume = latticeVolume(dimensions);
  if (volume > LATTICE_SIZE.maxVolume) {
    throw SimulationError.invalidLatticeVolume(volume, LATTICE_SIZE.maxVolume);
  }
}
