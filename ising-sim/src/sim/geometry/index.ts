import type { GeometryName } from "../../config/geometries";
import { GeometryOrchestrator } from "./orchestrator";
import type { LayoutGeometry } from "./types";

export type { Geometry, GeometryDefinition, GeometryInstance, LayoutGeometry } from "./types";
export { GeometryOrchestrator } from "./orchestrator";
export { GEOMETRY_DEFINITIONS } from "./definitions";

/** @deprecated Use GeometryOrchestrator.create instead. */
export function createGeometry(
  name: GeometryName,
  width: number,
  height: number,
): LayoutGeometry {
  return GeometryOrchestrator.create(name, [width, height]).core;
}
