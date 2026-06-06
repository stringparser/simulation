import { DEFAULT_SIM_CONFIG } from "../config";
import { Square2DOpen } from "../geometry/open";
import { NearestNeighbor } from "../interaction";
import { Lattice } from "../lattice";
import { energy, magnetization } from "../metrics";

describe("metrics", () => {
  const geometry = new Square2DOpen(2, 2);
  const interaction = new NearestNeighbor(1);

  it("computes expected energy and magnetization for all-up 2x2", () => {
    const lattice = Lattice.fromSpins([1, 1, 1, 1]);
    expect(energy(lattice, geometry, interaction, DEFAULT_SIM_CONFIG)).toBeCloseTo(-4, 10);
    expect(magnetization(lattice)).toBeCloseTo(4, 10);
  });

  it("matches all-up and all-down energy on 2x2", () => {
    const up = Lattice.fromSpins([1, 1, 1, 1]);
    const down = Lattice.fromSpins([-1, -1, -1, -1]);
    expect(energy(up, geometry, interaction, DEFAULT_SIM_CONFIG)).toBeCloseTo(
      energy(down, geometry, interaction, DEFAULT_SIM_CONFIG),
      10,
    );
    expect(magnetization(down)).toBeCloseTo(-4, 10);
  });
});

describe("NearestNeighbor", () => {
  it("computes delta energy for an all-up 2x2 corner", () => {
    const geometry = new Square2DOpen(2, 2);
    const lattice = Lattice.fromSpins([1, 1, 1, 1]);
    const interaction = new NearestNeighbor(1);
    expect(interaction.deltaEnergy(lattice, 0, geometry, 0)).toBeCloseTo(4, 10);
  });
});
