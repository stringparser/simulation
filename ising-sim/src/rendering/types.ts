import type { SessionSnapshot } from "../sim/session";
import type { OrbitView } from "./projection3d";

export type LatticeViewMode = "orbit" | "slice";

export interface SliceView {
  axis: 0 | 1 | 2;
  index: number;
}

export interface RenderOptions {
  viewMode?: LatticeViewMode;
  slice?: SliceView;
  orbit?: OrbitView;
}

export interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(snapshot: SessionSnapshot, options?: RenderOptions): void;
}

export interface CanvasRendererOptions {
  coldColor?: string;
  hotColor?: string;
  cellSize?: number;
  padding?: number;
}
