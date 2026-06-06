import type { CanvasRendererOptions, LatticeRenderer } from "./types";

const DEFAULT_UP_COLOR = "#4dabf7";
const DEFAULT_DOWN_COLOR = "#212529";
const DEFAULT_CELL_SIZE = 18;
const DEFAULT_PADDING = 1;

export function createCanvasRenderer(
  options: CanvasRendererOptions = {},
): LatticeRenderer {
  const upColor = options.upColor ?? DEFAULT_UP_COLOR;
  const downColor = options.downColor ?? DEFAULT_DOWN_COLOR;
  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const padding = options.padding ?? DEFAULT_PADDING;

  let container: HTMLElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let context: CanvasRenderingContext2D | null = null;

  return {
    mount(target) {
      container = target;
      canvas = document.createElement("canvas");
      canvas.className = "lattice-canvas";
      context = canvas.getContext("2d");
      container.replaceChildren(canvas);
    },

    unmount() {
      container?.replaceChildren();
      container = null;
      canvas = null;
      context = null;
    },

    draw(spins, width, height) {
      if (!canvas || !context) {
        return;
      }

      canvas.width = width * cellSize;
      canvas.height = height * cellSize;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const spin = spins[y * width + x];
          context.fillStyle = spin >= 0 ? upColor : downColor;
          context.fillRect(
            x * cellSize + padding,
            y * cellSize + padding,
            cellSize - padding * 2,
            cellSize - padding * 2,
          );
        }
      }
    },
  };
}
