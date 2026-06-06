import {
  alignedNeighborCount,
  colorForAlignedNeighbors,
  colorForSite,
  neighborCount,
} from "../rendering/neighborColors";

describe("neighborColors", () => {
  it("counts fewer geometric neighbors on open boundaries", () => {
    expect(neighborCount(0, 0, 4, 4, "square_2d_open")).toBe(2);
    expect(neighborCount(1, 1, 4, 4, "square_2d_open")).toBe(4);
  });

  it("counts aligned neighbors from spins", () => {
    const spins = [1, 1, -1, -1];

    expect(alignedNeighborCount(0, 0, 2, 2, "square_2d_open", spins)).toBe(1);
    expect(alignedNeighborCount(1, 1, 2, 2, "square_2d_open", spins)).toBe(1);
  });

  it("uses black when there are no aligned neighbors", () => {
    expect(colorForAlignedNeighbors(0, 4)).toBe("#212529");
  });

  it("maps one aligned neighbor to blue and full alignment to orange", () => {
    expect(colorForAlignedNeighbors(1, 4)).toBe("#4dabf7");
    expect(colorForAlignedNeighbors(4, 4)).toBe("#ff6b35");
  });

  it("changes color when aligned neighbors change", () => {
    const ordered = colorForSite(1, 1, 4, 4, "square_2d_open", [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
    const disordered = colorForSite(1, 1, 4, 4, "square_2d_open", [
      1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1,
    ]);

    expect(ordered).toBe("#ff6b35");
    expect(disordered).toBe("#212529");
  });
});
