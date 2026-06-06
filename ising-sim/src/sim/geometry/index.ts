import type { GeometryName } from "../../config/geometries";
import { SimulationError } from "../errors";
import { Square2DOpen } from "./open";
import { Square2DPeriodic } from "./periodic";
import type { Geometry } from "./types";

export type { Geometry } from "./types";
export { Square2DOpen } from "./open";
export { Square2DPeriodic } from "./periodic";

export function createGeometry(
  name: GeometryName,
  width: number,
  height: number,
): Geometry {
  switch (name) {
    case "square_2d_open":
      return new Square2DOpen(width, height);
    case "square_2d_periodic":
      return new Square2DPeriodic(width, height);
    default:
      throw SimulationError.unsupportedGeometry(name);
  }
}
