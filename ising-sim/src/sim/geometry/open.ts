import type { GeometryName } from "../../config/geometries";
import type { Geometry } from "./types";

export class Square2DOpen implements Geometry {
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

  dimensions(): [number, number] {
    return [this.width, this.height];
  }

  neighbors(site: number): readonly number[] {
    return this.neighborLists[site];
  }

  indexToCoord(site: number): [number, number] {
    return [site % this.width, Math.floor(site / this.width)];
  }

  coordToIndex(x: number, y: number): number | null {
    if (x >= this.width || y >= this.height) {
      return null;
    }
    return y * this.width + x;
  }

  name(): GeometryName {
    return "square_2d_open";
  }
}
