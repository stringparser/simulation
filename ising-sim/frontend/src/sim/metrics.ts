import type { SimConfig } from "./config";
import type { Geometry } from "./geometry";
import type { Interaction } from "./interaction";
import type { Lattice } from "./lattice";

export function energy(
  lattice: Lattice,
  geometry: Geometry,
  interaction: Interaction,
  config: SimConfig,
): number {
  let total = 0;

  for (let site = 0; site < geometry.numSites(); site += 1) {
    const spin = lattice.spin(site);
    total -= config.field * spin;
    total -= config.coupling * spin * interaction.neighborSum(lattice, site, geometry);
  }

  // Each bond is counted twice in the neighbor sum.
  return total * 0.5;
}

export function magnetization(lattice: Lattice): number {
  let total = 0;
  for (let site = 0; site < lattice.length; site += 1) {
    total += lattice.spin(site);
  }
  return total;
}
