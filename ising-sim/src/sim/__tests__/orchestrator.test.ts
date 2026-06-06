import { LATTICE_SIZE } from "../../config/lattice";
import { SimulationError } from "../errors";
import { Square2DOpen } from "../geometry/open";
import { Square2DPeriodic } from "../geometry/periodic";
import { GeometryOrchestrator } from "../geometry/orchestrator";

describe("GeometryOrchestrator", () => {
  it("lists the built-in 2D geometry presets", () => {
    const definitions = GeometryOrchestrator.listDefinitions();
    expect(definitions).toHaveLength(2);
    expect(definitions.map((definition) => definition.name)).toEqual([
      "square_2d_open",
      "square_2d_periodic",
    ]);
  });

  it("exposes UI options with rank metadata", () => {
    expect(GeometryOrchestrator.optionsForUi()).toEqual([
      { value: "square_2d_open", label: "Open edges", rank: 2 },
      { value: "square_2d_periodic", label: "Periodic (torus)", rank: 2 },
    ]);
  });

  it("returns default dimensions for a preset", () => {
    expect(GeometryOrchestrator.defaultDimensions("square_2d_open")).toEqual([
      LATTICE_SIZE.defaultWidth,
      LATTICE_SIZE.defaultHeight,
    ]);
  });

  it("rejects invalid dimensions before creating a layout", () => {
    expect(() =>
      GeometryOrchestrator.create("square_2d_open", [2, 16]),
    ).toThrow(SimulationError);
  });

  it("creates layouts with the same neighbor topology as direct implementations", () => {
    const layout = GeometryOrchestrator.create("square_2d_open", [4, 4]);
    const direct = new Square2DOpen(4, 4);

    for (let site = 0; site < layout.numSites(); site += 1) {
      expect(layout.neighbors(site)).toEqual(direct.neighbors(site));
      expect(layout.indexToCoord(site)).toEqual(direct.indexToCoord(site));
    }
  });

  it("recreates a layout from snapshot fields", () => {
    const original = GeometryOrchestrator.create("square_2d_periodic", [6, 8]);
    const restored = GeometryOrchestrator.createFromSnapshot({
      geometry: original.definition.name,
      dimensions: original.dimensions,
    });

    expect(restored.dimensions).toEqual([6, 8]);
    expect(restored.maxNeighbors()).toBe(4);
    expect(restored.neighbors(0)).toEqual(new Square2DPeriodic(6, 8).neighbors(0));
  });
});
