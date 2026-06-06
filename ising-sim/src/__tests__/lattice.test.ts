import { clampLatticeSize, LATTICE_SIZE, latticeSiteCount, validateDimensions } from "../config/lattice";
import { SimulationError } from "../sim/errors";

describe("lattice config", () => {
  it("clamps size to supported bounds", () => {
    expect(clampLatticeSize(2)).toBe(LATTICE_SIZE.min);
    expect(clampLatticeSize(100)).toBe(LATTICE_SIZE.max);
    expect(clampLatticeSize(12.7)).toBe(13);
  });

  it("returns fallback for invalid input", () => {
    expect(clampLatticeSize(Number.NaN, 16)).toBe(16);
  });

  it("computes site count", () => {
    expect(latticeSiteCount(8, 10)).toBe(80);
    expect(latticeSiteCount(8, 8, 8)).toBe(512);
  });

  it("rejects lattices above the max volume", () => {
    expect(() => validateDimensions([32, 32, 33])).toThrow(SimulationError);
    expect(() => validateDimensions([8, 8, 8])).not.toThrow();
  });
});
