import { LATTICE_COLORS } from "../config/colors";
import { GeometryOrchestrator } from "../sim/geometry/orchestrator";
import type { GeometryInstance } from "../sim/geometry/types";
import type { SessionSnapshot } from "../sim/session";
import {
  DEFAULT_ORBIT_VIEW,
  orbitLayoutMetrics,
  projectLatticeSites,
  type OrbitView,
} from "./projection3d";
import type { CanvasRendererOptions, LatticeRenderer, RenderOptions, SliceView } from "./types";

const DEFAULT_COLD_COLOR = LATTICE_COLORS.cold;
const DEFAULT_HOT_COLOR = LATTICE_COLORS.hot;
const DEFAULT_CELL_SIZE = 18;
const DEFAULT_PADDING = 1;
const ORBIT_CANVAS_SIZE = 380;
const ORBIT_PADDING = 24;

function sliceCanvasSize(
  dimensions: readonly number[],
  axis: SliceView["axis"],
): readonly [number, number] {
  if (axis === 0) {
    return [dimensions[1], dimensions[2]];
  }
  if (axis === 1) {
    return [dimensions[0], dimensions[2]];
  }
  return [dimensions[0], dimensions[1]];
}

function sliceDisplayCoord(
  coord: readonly number[],
  axis: SliceView["axis"],
): readonly [number, number] {
  if (axis === 0) {
    return [coord[1], coord[2]];
  }
  if (axis === 1) {
    return [coord[0], coord[2]];
  }
  return [coord[0], coord[1]];
}

function drawLatticeSlice(
  context: CanvasRenderingContext2D,
  layout: GeometryInstance,
  snapshot: SessionSnapshot,
  slice: SliceView,
  palette: { cold: string; hot: string; none: string },
  cellSize: number,
  padding: number,
): void {
  for (let site = 0; site < layout.numSites(); site += 1) {
    const coord = layout.indexToCoord(site);
    if (coord[slice.axis] !== slice.index) {
      continue;
    }

    const [x, y] = sliceDisplayCoord(coord, slice.axis);
    context.fillStyle = layout.colorForSite(site, snapshot.spins, palette);
    context.fillRect(
      x * cellSize + padding,
      y * cellSize + padding,
      cellSize - padding * 2,
      cellSize - padding * 2,
    );
  }
}

function drawLatticeOrbit(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  layout: GeometryInstance,
  snapshot: SessionSnapshot,
  orbit: OrbitView,
  palette: { cold: string; hot: string; none: string },
): void {
  const projected = projectLatticeSites(layout, orbit);
  const metrics = orbitLayoutMetrics(projected);
  const maxSpan = Math.max(metrics.spanX, metrics.spanY);
  const scale = (ORBIT_CANVAS_SIZE - ORBIT_PADDING * 2) / maxSpan;
  const cellDrawSize = Math.max(2, scale * 0.82);
  const offsetX =
    ORBIT_PADDING + (ORBIT_CANVAS_SIZE - ORBIT_PADDING * 2 - metrics.spanX * scale) / 2 -
    metrics.minX * scale;
  const offsetY =
    ORBIT_PADDING + (ORBIT_CANVAS_SIZE - ORBIT_PADDING * 2 - metrics.spanY * scale) / 2 -
    metrics.minY * scale;

  canvas.width = ORBIT_CANVAS_SIZE;
  canvas.height = ORBIT_CANVAS_SIZE;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const point of projected) {
    context.fillStyle = layout.colorForSite(point.site, snapshot.spins, palette);
    context.fillRect(
      offsetX + point.screenX * scale,
      offsetY + point.screenY * scale,
      cellDrawSize,
      cellDrawSize,
    );
  }
}

export function createCanvasRenderer(
  options: CanvasRendererOptions = {},
): LatticeRenderer {
  const coldColor = options.coldColor ?? DEFAULT_COLD_COLOR;
  const hotColor = options.hotColor ?? DEFAULT_HOT_COLOR;
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

    draw(snapshot: SessionSnapshot, renderOptions: RenderOptions = {}) {
      if (!canvas || !context) {
        return;
      }

      const layout = GeometryOrchestrator.createFromSnapshot(snapshot);
      const palette = {
        cold: coldColor,
        hot: hotColor,
        none: LATTICE_COLORS.none,
      };

      if (snapshot.rank === 2) {
        const [width, height] = snapshot.dimensions;
        canvas.width = width * cellSize;
        canvas.height = height * cellSize;

        for (let site = 0; site < layout.numSites(); site += 1) {
          const [x, y] = layout.indexToCoord(site);
          context.fillStyle = layout.colorForSite(site, snapshot.spins, palette);
          context.fillRect(
            x * cellSize + padding,
            y * cellSize + padding,
            cellSize - padding * 2,
            cellSize - padding * 2,
          );
        }
        return;
      }

      if (snapshot.rank !== 3) {
        return;
      }

      const viewMode = renderOptions.viewMode ?? "orbit";
      if (viewMode === "orbit") {
        drawLatticeOrbit(
          context,
          canvas,
          layout,
          snapshot,
          renderOptions.orbit ?? DEFAULT_ORBIT_VIEW,
          palette,
        );
        return;
      }

      const slice = renderOptions.slice ?? {
        axis: 2,
        index: Math.floor(snapshot.dimensions[2] / 2),
      };
      const [displayWidth, displayHeight] = sliceCanvasSize(snapshot.dimensions, slice.axis);

      canvas.width = displayWidth * cellSize;
      canvas.height = displayHeight * cellSize;
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawLatticeSlice(context, layout, snapshot, slice, palette, cellSize, padding);
    },
  };
}
