import type { GeometryName } from "../../config/geometries";
import { SimulationError } from "../errors";
import { GEOMETRY_DEFINITIONS } from "./definitions";
import { GeometryInstanceImpl } from "./instance";
import type { GeometryDefinition, GeometryInstance } from "./types";

function getDefinition(name: GeometryName): GeometryDefinition {
  const definition = GEOMETRY_DEFINITIONS.find((entry) => entry.name === name);
  if (!definition) {
    throw SimulationError.unsupportedGeometry(name);
  }
  return definition;
}

function normalizeDimensions(
  definition: GeometryDefinition,
  dimensions: readonly number[],
): readonly number[] {
  if (dimensions.length !== definition.rank) {
    throw SimulationError.invalidLatticeSize(
      dimensions[0] ?? 0,
      dimensions[1] ?? dimensions[0] ?? 0,
    );
  }

  return dimensions;
}

export class GeometryOrchestrator {
  static listDefinitions(): readonly GeometryDefinition[] {
    return GEOMETRY_DEFINITIONS;
  }

  static optionsForUi(): Array<{ value: GeometryName; label: string; rank: number }> {
    return GEOMETRY_DEFINITIONS.map((definition) => ({
      value: definition.name,
      label: definition.label,
      rank: definition.rank,
    }));
  }

  static defaultDimensions(name: GeometryName): readonly number[] {
    return getDefinition(name).defaultDimensions;
  }

  static validate(name: GeometryName, dimensions: readonly number[]): void {
    const definition = getDefinition(name);
    const normalized = normalizeDimensions(definition, dimensions);
    definition.validate(normalized);
  }

  static create(name: GeometryName, dimensions: readonly number[]): GeometryInstance {
    const definition = getDefinition(name);
    const normalized = normalizeDimensions(definition, dimensions);
    definition.validate(normalized);
    const core = definition.createCore(normalized);
    return new GeometryInstanceImpl(definition, normalized, core);
  }

  static createFromSnapshot(snapshot: {
    geometry: GeometryName;
    dimensions: readonly number[];
  }): GeometryInstance {
    return GeometryOrchestrator.create(snapshot.geometry, snapshot.dimensions);
  }
}
