import type { GeometryName } from "../../config/geometries";
import type { ColorPalette } from "../../config/colors";
export interface Geometry {
  numSites(): number;
  neighbors(site: number): readonly number[];
}

/** Coordinate helpers for layout-aware geometry implementations. */
export interface LayoutGeometry extends Geometry {
  dimensions(): readonly number[];
  indexToCoord(site: number): readonly number[];
  coordToIndex(coord: readonly number[]): number | null;
  name(): GeometryName;
}

export interface GeometryDefinition {
  name: GeometryName;
  label: string;
  rank: 2 | 3;
  defaultDimensions: readonly number[];
  dimensionLabels: readonly string[];

  validate(dimensions: readonly number[]): void;
  createCore(dimensions: readonly number[]): LayoutGeometry;
  maxNeighbors(dimensions: readonly number[]): number;
}

export interface GeometryInstance {
  readonly definition: GeometryDefinition;
  readonly dimensions: readonly number[];
  readonly core: LayoutGeometry;

  numSites(): number;
  neighbors(site: number): readonly number[];
  indexToCoord(site: number): readonly number[];
  coordToIndex(coord: readonly number[]): number | null;
  maxNeighbors(): number;
  alignedNeighborCount(site: number, spins: number[] | Int8Array): number;
  colorForSite(
    site: number,
    spins: number[] | Int8Array,
    palette?: ColorPalette,
  ): string;
}
