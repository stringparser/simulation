import { LATTICE_SIZE, validateDimensions } from "../../config/lattice";
import { Cubic3DOpen } from "./open3d";
import { Cubic3DPeriodic } from "./periodic3d";
import { Square2DOpen } from "./open";
import { Square2DPeriodic } from "./periodic";
import type { GeometryDefinition } from "./types";

const DEFAULT_3D_DIMENSIONS = [
  LATTICE_SIZE.defaultDepth,
  LATTICE_SIZE.defaultDepth,
  LATTICE_SIZE.defaultDepth,
] as const;

export const GEOMETRY_DEFINITIONS: readonly GeometryDefinition[] = [
  {
    name: "square_2d_open",
    label: "Open edges",
    rank: 2,
    defaultDimensions: [LATTICE_SIZE.defaultWidth, LATTICE_SIZE.defaultHeight],
    dimensionLabels: ["Width", "Height"],
    validate: validateDimensions,
    createCore: (dimensions) => new Square2DOpen(dimensions[0], dimensions[1]),
    maxNeighbors: () => 4,
  },
  {
    name: "square_2d_periodic",
    label: "Periodic (torus)",
    rank: 2,
    defaultDimensions: [LATTICE_SIZE.defaultWidth, LATTICE_SIZE.defaultHeight],
    dimensionLabels: ["Width", "Height"],
    validate: validateDimensions,
    createCore: (dimensions) => new Square2DPeriodic(dimensions[0], dimensions[1]),
    maxNeighbors: () => 4,
  },
  {
    name: "cubic_3d_open",
    label: "Open cube",
    rank: 3,
    defaultDimensions: DEFAULT_3D_DIMENSIONS,
    dimensionLabels: ["Width", "Height", "Depth"],
    validate: validateDimensions,
    createCore: (dimensions) =>
      new Cubic3DOpen(dimensions[0], dimensions[1], dimensions[2]),
    maxNeighbors: () => 6,
  },
  {
    name: "cubic_3d_periodic",
    label: "Periodic cube",
    rank: 3,
    defaultDimensions: DEFAULT_3D_DIMENSIONS,
    dimensionLabels: ["Width", "Height", "Depth"],
    validate: validateDimensions,
    createCore: (dimensions) =>
      new Cubic3DPeriodic(dimensions[0], dimensions[1], dimensions[2]),
    maxNeighbors: () => 6,
  },
];
