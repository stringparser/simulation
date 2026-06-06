import type { GeometryName } from "../../config/geometries";
import type { LayoutGeometry } from "./types";

export class Square2DOpen implements LayoutGeometry {
  readonly width: number;
  readonly height: number;
  private readonly neighborLists: number[][];

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error("lattice dimensions must be positive");
    }

    this.width = width;
    this.height = height;
    this.neighborLists = Array.from({ length: width * height }, () => []);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const site = y * width + x;
        if (x > 0) {
          this.neighborLists[site].push(site - 1);
        }
        if (x + 1 < width) {
          this.neighborLists[site].push(site + 1);
        }
        if (y > 0) {
          this.neighborLists[site].push(site - width);
        }
        if (y + 1 < height) {
          this.neighborLists[site].push(site + width);
        }
      }
    }
  }

  numSites(): number {
    return this.width * this.height;
  }

  dimensions(): readonly number[] {
    return [this.width, this.height];
  }

  neighbors(site: number): readonly number[] {
    return this.neighborLists[site];
  }

  indexToCoord(site: number): readonly number[] {
    return [site % this.width, Math.floor(site / this.width)];
  }

  coordToIndex(coord: readonly number[]): number | null {
    if (coord.length < 2) {
      return null;
    }

    const [x, y] = coord;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return y * this.width + x;
  }

  name(): GeometryName {
    return "square_2d_open";
  }
}
