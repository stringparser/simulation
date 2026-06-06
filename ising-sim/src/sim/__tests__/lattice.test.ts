import { Lattice } from "../lattice";
import { SimulationError } from "../errors";

describe("Lattice", () => {
  it("rejects invalid spin values", () => {
    expect(() => Lattice.fromSpins([1, 0, -1])).toThrow(SimulationError);
  });

  it("tracks empty lattices", () => {
    expect(Lattice.fromSpins([]).length).toBe(0);
  });

  it("creates reproducible lattices from a seed", () => {
    const first = Lattice.create(16, 7).spinsArray();
    const second = Lattice.create(16, 7).spinsArray();
    expect(second).toEqual(first);
  });
});
