import { colorForAlignedNeighbors, LATTICE_COLORS } from "../../config/colors";
import { GeometryOrchestrator } from "../geometry/orchestrator";

describe("GeometryInstance coloring", () => {
  it("counts fewer geometric neighbors on open boundaries", () => {
    const layout = GeometryOrchestrator.create("square_2d_open", [4, 4]);

    expect(layout.neighbors(0)).toHaveLength(2);
    expect(layout.neighbors(5)).toHaveLength(4);
  });

  it("counts aligned neighbors from spins", () => {
    const layout = GeometryOrchestrator.create("square_2d_open", [4, 4]);
    const spins = new Array(16).fill(-1);
    spins[0] = 1;
    spins[1] = 1;
    spins[5] = 1;
    spins[6] = -1;

    expect(layout.alignedNeighborCount(0, spins)).toBe(1);
    expect(layout.alignedNeighborCount(5, spins)).toBe(1);
  });

  it("uses black when there are no aligned neighbors", () => {
    expect(colorForAlignedNeighbors(0, 4)).toBe(LATTICE_COLORS.none);
  });

  it("maps one aligned neighbor to blue and full alignment to orange", () => {
    expect(colorForAlignedNeighbors(1, 4)).toBe(LATTICE_COLORS.cold);
    expect(colorForAlignedNeighbors(4, 4)).toBe(LATTICE_COLORS.hot);
  });

  it("changes color when aligned neighbors change", () => {
    const layout = GeometryOrchestrator.create("square_2d_open", [4, 4]);
    const ordered = layout.colorForSite(
      5,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    );
    const disordered = layout.colorForSite(
      5,
      [1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1],
    );

    expect(ordered).toBe(LATTICE_COLORS.hot);
    expect(disordered).toBe(LATTICE_COLORS.none);
  });
});
