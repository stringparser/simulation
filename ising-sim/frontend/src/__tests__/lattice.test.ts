import { clampLatticeSize, LATTICE_SIZE, latticeSiteCount } from "../config/lattice";

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
  });
});
