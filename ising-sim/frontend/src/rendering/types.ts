export interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(spins: number[] | Int8Array, width: number, height: number): void;
  resize?(width: number, height: number): void;
}

export interface CanvasRendererOptions {
  upColor?: string;
  downColor?: string;
  cellSize?: number;
  padding?: number;
}
