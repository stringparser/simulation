import type { GeometryName } from "../../config/geometries";

export interface Geometry {
  numSites(): number;
  dimensions(): [number, number];
  neighbors(site: number): readonly number[];
  indexToCoord(site: number): [number, number];
  coordToIndex(x: number, y: number): number | null;
  name(): GeometryName;
}
