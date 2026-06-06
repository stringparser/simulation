import type { Geometry } from "./geometry";
import type { Lattice } from "./lattice";

export interface Interaction {
  neighborSum(lattice: Lattice, site: number, geometry: Geometry): number;
  deltaEnergy(lattice: Lattice, site: number, geometry: Geometry, field: number): number;
}

export class NearestNeighbor implements Interaction {
  constructor(readonly j: number) {}

  neighborSum(lattice: Lattice, site: number, geometry: Geometry): number {
    return geometry
      .neighbors(site)
      .reduce((sum, neighbor) => sum + lattice.spin(neighbor), 0);
  }

  deltaEnergy(lattice: Lattice, site: number, geometry: Geometry, field: number): number {
    const spin = lattice.spin(site);
    const neighborSum = this.neighborSum(lattice, site, geometry);
    return 2 * spin * (field + this.j * neighborSum);
  }
}
