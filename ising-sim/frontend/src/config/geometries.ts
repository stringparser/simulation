export const GEOMETRY_OPTIONS = [
  { value: "square_2d_open", label: "Open edges" },
  { value: "square_2d_periodic", label: "Periodic (torus)" },
] as const;

export type GeometryName = (typeof GEOMETRY_OPTIONS)[number]["value"];
