import { LATTICE_COLORS } from "../config/colors";
import type { GeometryName } from "../config/geometries";

const DEFAULT_COLD_COLOR = LATTICE_COLORS.cold;
const DEFAULT_HOT_COLOR = LATTICE_COLORS.hot;
const NO_MAGNETIZATION_COLOR = LATTICE_COLORS.none;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHexColor(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function formatHexColor({ r, g, b }: Rgb): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lerpChannel(start: number, end: number, t: number): number {
  return Math.round(start + (end - start) * t);
}

function lerpColor(
  coldColor: string,
  hotColor: string,
  t: number,
): string {
  const cold = parseHexColor(coldColor);
  const hot = parseHexColor(hotColor);

  return formatHexColor({
    r: lerpChannel(cold.r, hot.r, t),
    g: lerpChannel(cold.g, hot.g, t),
    b: lerpChannel(cold.b, hot.b, t),
  });
}

export function neighborCount(
  x: number,
  y: number,
  width: number,
  height: number,
  geometry: GeometryName,
): number {
  return neighborCoordinates(x, y, width, height, geometry).length;
}

export function neighborCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  geometry: GeometryName,
): Array<[number, number]> {
  if (geometry === "square_2d_periodic") {
    return [
      [(x + width - 1) % width, y],
      [(x + 1) % width, y],
      [x, (y + height - 1) % height],
      [x, (y + 1) % height],
    ];
  }

  const coordinates: Array<[number, number]> = [];
  if (x > 0) {
    coordinates.push([x - 1, y]);
  }
  if (x < width - 1) {
    coordinates.push([x + 1, y]);
  }
  if (y > 0) {
    coordinates.push([x, y - 1]);
  }
  if (y < height - 1) {
    coordinates.push([x, y + 1]);
  }
  return coordinates;
}

export function alignedNeighborCount(
  x: number,
  y: number,
  width: number,
  height: number,
  geometry: GeometryName,
  spins: number[] | Int8Array,
): number {
  const site = y * width + x;
  const spin = spins[site];

  return neighborCoordinates(x, y, width, height, geometry).filter(
    ([neighborX, neighborY]) => spins[neighborY * width + neighborX] === spin,
  ).length;
}

export function colorForAlignedNeighbors(
  aligned: number,
  maxNeighbors: number,
  coldColor: string = DEFAULT_COLD_COLOR,
  hotColor: string = DEFAULT_HOT_COLOR,
): string {
  if (aligned === 0) {
    return NO_MAGNETIZATION_COLOR;
  }

  if (maxNeighbors <= 1) {
    return hotColor;
  }

  const t = (aligned - 1) / (maxNeighbors - 1);
  return lerpColor(coldColor, hotColor, t);
}

export function colorForSite(
  x: number,
  y: number,
  width: number,
  height: number,
  geometry: GeometryName,
  spins: number[] | Int8Array,
  coldColor: string = DEFAULT_COLD_COLOR,
  hotColor: string = DEFAULT_HOT_COLOR,
): string {
  const maxNeighbors = neighborCount(x, y, width, height, geometry);
  const aligned = alignedNeighborCount(x, y, width, height, geometry, spins);
  return colorForAlignedNeighbors(aligned, maxNeighbors, coldColor, hotColor);
}
