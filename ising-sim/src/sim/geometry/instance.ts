import type { ColorPalette } from "../../config/colors";
import { colorForAlignedNeighbors, DEFAULT_COLOR_PALETTE } from "../../config/colors";
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

    return this.core.coordToIndex(coord);
  }

  maxNeighbors(): number {
    return this.definition.maxNeighbors(this.dimensions);
  }

  alignedNeighborCount(site: number, spins: number[] | Int8Array): number {
    const spin = spins[site];
    return this.core.neighbors(site).filter((neighbor) => spins[neighbor] === spin).length;
  }

  colorForSite(
    site: number,
    spins: number[] | Int8Array,
    palette: ColorPalette = DEFAULT_COLOR_PALETTE,
  ): string {
    const aligned = this.alignedNeighborCount(site, spins);
    const geometricNeighbors = this.core.neighbors(site).length;
    return colorForAlignedNeighbors(aligned, geometricNeighbors, palette);
  }
}
