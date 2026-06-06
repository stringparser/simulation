export const GEOMETRY_OPTIONS = [
  { value: "square_2d_open", label: "Open edges" },
  { value: "square_2d_periodic", label: "Periodic (torus)" },
  { value: "cubic_3d_open", label: "Open cube" },
  { value: "cubic_3d_periodic", label: "Periodic cube" },
] as const;

export type GeometryName = (typeof GEOMETRY_OPTIONS)[number]["value"];

export const DEFAULT_GEOMETRY: GeometryName = "square_2d_open";

export function isGeometryName(value: string): value is GeometryName {
  return GEOMETRY_OPTIONS.some((option) => option.value === value);
}

export function geometryLabel(name: GeometryName | string): string {
  return GEOMETRY_OPTIONS.find((option) => option.value === name)?.label ?? name;
}
