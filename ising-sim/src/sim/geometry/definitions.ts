import { LATTICE_SIZE, validateDimensions } from "../../config/lattice";
import { Square2DOpen } from "./open";
import { Square2DPeriodic } from "./periodic";
import type { GeometryDefinition } from "./types";

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
];
