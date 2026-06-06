import type { SessionSnapshot } from "../sim/session";

export interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(snapshot: SessionSnapshot): void;
}

export interface CanvasRendererOptions {
  coldColor?: string;
  hotColor?: string;
  cellSize?: number;
  padding?: number;
}
