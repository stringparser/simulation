import type { GeometryName } from "../config/geometries";

export interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(
    spins: number[] | Int8Array,
    width: number,
    height: number,
    geometry: GeometryName,
  ): void;
}

export interface CanvasRendererOptions {
  coldColor?: string;
  hotColor?: string;
  cellSize?: number;
  padding?: number;
}
