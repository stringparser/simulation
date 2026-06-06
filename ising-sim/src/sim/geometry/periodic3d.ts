import type { GeometryName } from "../../config/geometries";
import type { LayoutGeometry } from "./types";

export class Cubic3DPeriodic implements LayoutGeometry {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  private readonly xy: number;
  private readonly neighborLists: number[][];

  constructor(width: number, height: number, depth: number) {
    if (width <= 0 || height <= 0 || depth <= 0) {
      throw new Error("lattice dimensions must be positive");
    }

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.xy = width * height;
    this.neighborLists = Array.from({ length: width * height * depth }, () => []);

    for (let z = 0; z < depth; z += 1) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const site = x + y * width + z * this.xy;
          this.neighborLists[site].push(
            (x + width - 1) % width + y * width + z * this.xy,
          );
          this.neighborLists[site].push(
            (x + 1) % width + y * width + z * this.xy,
          );
          this.neighborLists[site].push(
            x + ((y + height - 1) % height) * width + z * this.xy,
          );
          this.neighborLists[site].push(
            x + ((y + 1) % height) * width + z * this.xy,
          );
          this.neighborLists[site].push(
            x + y * width + ((z + depth - 1) % depth) * this.xy,
          );
          this.neighborLists[site].push(
            x + y * width + ((z + 1) % depth) * this.xy,
          );
        }
      }
    }
  }

  numSites(): number {
    return this.width * this.height * this.depth;
  }

  dimensions(): readonly number[] {
    return [this.width, this.height, this.depth];
  }

  neighbors(site: number): readonly number[] {
    return this.neighborLists[site];
  }

  indexToCoord(site: number): readonly number[] {
    const z = Math.floor(site / this.xy);
    const remainder = site % this.xy;
    const y = Math.floor(remainder / this.width);
    const x = remainder % this.width;
    return [x, y, z];
  }

  coordToIndex(coord: readonly number[]): number | null {
    if (coord.length < 3) {
      return null;
    }

    const [x, y, z] = coord;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return null;
    }

    return x + y * this.width + z * this.xy;
  }

  name(): GeometryName {
    return "cubic_3d_periodic";
  }
}
