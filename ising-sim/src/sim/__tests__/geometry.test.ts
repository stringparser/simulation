import { Square2DOpen } from "../geometry/open";
import { Square2DPeriodic } from "../geometry/periodic";
import { Cubic3DOpen } from "../geometry/open3d";
import { Cubic3DPeriodic } from "../geometry/periodic3d";

describe("Square2DOpen", () => {
  const geometry = new Square2DOpen(4, 4);

  it("assigns two neighbors to corners on a 4x4 grid", () => {
    expect(geometry.neighbors(0)).toHaveLength(2);
    expect(geometry.neighbors(15)).toHaveLength(2);
  });

  it("assigns three neighbors to edges on a 4x4 grid", () => {
    expect(geometry.neighbors(1)).toHaveLength(3);
    expect(geometry.neighbors(4)).toHaveLength(3);
  });

  it("assigns four neighbors to interior sites on a 4x4 grid", () => {
    expect(geometry.neighbors(5)).toHaveLength(4);
    expect(geometry.neighbors(10)).toHaveLength(4);
  });

  it("round-trips coordinates and indices", () => {
    for (let site = 0; site < geometry.numSites(); site += 1) {
      const [x, y] = geometry.indexToCoord(site);
      expect(geometry.coordToIndex([x, y])).toBe(site);
    }
  });
});

describe("Square2DPeriodic", () => {
  it("gives every site four neighbors on a 4x4 grid", () => {
    const geometry = new Square2DPeriodic(4, 4);
    for (let site = 0; site < geometry.numSites(); site += 1) {
      expect(geometry.neighbors(site)).toHaveLength(4);
    }
  });

  it("wraps corners on a 2x2 torus", () => {
    const geometry = new Square2DPeriodic(2, 2);
    expect(geometry.neighbors(0)).toHaveLength(4);
    expect(geometry.neighbors(0)).toEqual(expect.arrayContaining([1, 2]));
  });
});

describe("Cubic3DOpen", () => {
  const geometry = new Cubic3DOpen(4, 4, 4);

  it("assigns fewer than six neighbors on open faces", () => {
    expect(geometry.neighbors(0)).toHaveLength(3);
    expect(geometry.neighbors(geometry.numSites() - 1)).toHaveLength(3);
  });

  it("assigns six neighbors to interior sites", () => {
    const center = geometry.coordToIndex([2, 2, 2]);
    expect(center).not.toBeNull();
    if (center !== null) {
      expect(geometry.neighbors(center)).toHaveLength(6);
    }
  });

  it("round-trips coordinates and indices", () => {
    for (let site = 0; site < geometry.numSites(); site += 1) {
      const coord = geometry.indexToCoord(site);
      expect(geometry.coordToIndex(coord)).toBe(site);
    }
  });
});

describe("Cubic3DPeriodic", () => {
  it("gives every site six neighbors on a 4x4x4 cube", () => {
    const geometry = new Cubic3DPeriodic(4, 4, 4);
    for (let site = 0; site < geometry.numSites(); site += 1) {
      expect(geometry.neighbors(site)).toHaveLength(6);
    }
  });
});
