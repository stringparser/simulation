import { Square2DOpen } from "../geometry/open";
import { NearestNeighbor } from "../interaction";
import { Lattice } from "../lattice";
import { sweep } from "../monteCarlo";
import { SeededRng } from "../rng";

describe("monteCarlo", () => {
  it("accepts flips when delta energy is negative", () => {
    const geometry = new Square2DOpen(2, 2);
    const lattice = Lattice.fromSpins([1, -1, -1, 1]);
    const interaction = new NearestNeighbor(1);
    const config = {
      dimensions: [2, 2],
      temperature: 0.1,
      field: 0,
      coupling: 1,
      geometry: "square_2d_open" as const,
    };
    const before = lattice.spinsArray();
    const stats = sweep(lattice, geometry, interaction, config, SeededRng.fromSeed(42));

    expect(stats.acceptances).toBeGreaterThan(0);
    expect(lattice.spinsArray()).not.toEqual(before);
  });
});
