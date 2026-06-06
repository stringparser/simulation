export const LATTICE_COLORS = {
  cold: "#4dabf7",
  hot: "#ff6b35",
  none: "#212529",
} as const;

export const THEME_COLORS = {
  text: "#e8e8e8",
  textMuted: "#bdbdbd",
  textSubtle: "#888",
  surface: "#252525",
  border: "#3a3a3a",
  panel: "#1a1a1a",
  panelBorder: "#2d2d2d",
  background: "#111",
} as const;

export interface ColorPalette {
  cold: string;
  hot: string;
  none: string;
}

export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  cold: LATTICE_COLORS.cold,
  hot: LATTICE_COLORS.hot,
  none: LATTICE_COLORS.none,
};

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

function lerpColor(coldColor: string, hotColor: string, t: number): string {
  const cold = parseHexColor(coldColor);
  const hot = parseHexColor(hotColor);

  return formatHexColor({
    r: lerpChannel(cold.r, hot.r, t),
    g: lerpChannel(cold.g, hot.g, t),
    b: lerpChannel(cold.b, hot.b, t),
  });
}

export function colorForAlignedNeighbors(
  aligned: number,
  geometricNeighbors: number,
  palette: ColorPalette = DEFAULT_COLOR_PALETTE,
): string {
  if (aligned === 0) {
    return palette.none;
  }

  if (geometricNeighbors <= 1) {
    return palette.hot;
  }

  const t = (aligned - 1) / (geometricNeighbors - 1);
  return lerpColor(palette.cold, palette.hot, t);
}
