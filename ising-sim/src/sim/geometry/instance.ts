import type { GeometryDefinition, GeometryInstance, LayoutGeometry } from "./types";

export class GeometryInstanceImpl implements GeometryInstance {
  readonly definition: GeometryDefinition;
  readonly dimensions: readonly number[];
  readonly core: LayoutGeometry;

  constructor(definition: GeometryDefinition, dimensions: readonly number[], core: LayoutGeometry) {
    this.definition = definition;
    this.dimensions = dimensions;
    this.core = core;
  }

  numSites(): number {
    return this.core.numSites();
  }

  neighbors(site: number): readonly number[] {
    return this.core.neighbors(site);
  }

  indexToCoord(site: number): readonly number[] {
    return this.core.indexToCoord(site);
  }

  coordToIndex(coord: readonly number[]): number | null {
    if (coord.length !== this.definition.rank) {
      return null;
    }

    return this.core.coordToIndex(coord[0], coord[1]);
  }

  maxNeighbors(): number {
    return this.definition.maxNeighbors(this.dimensions);
  }
}
