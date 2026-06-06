import { LATTICE_SIZE } from "../../config/lattice";
import { SimulationError } from "../errors";
import { Cubic3DOpen } from "../geometry/open3d";
import { Cubic3DPeriodic } from "../geometry/periodic3d";
import { Square2DOpen } from "../geometry/open";
import { Square2DPeriodic } from "../geometry/periodic";
import { GeometryOrchestrator } from "../geometry/orchestrator";

describe("GeometryOrchestrator", () => {
  it("lists the built-in geometry presets", () => {
    const definitions = GeometryOrchestrator.listDefinitions();
    expect(definitions).toHaveLength(4);
    expect(definitions.map((definition) => definition.name)).toEqual([
      "square_2d_open",
      "square_2d_periodic",
      "cubic_3d_open",
      "cubic_3d_periodic",
    ]);
  });

  it("exposes UI options with rank metadata", () => {
    expect(GeometryOrchestrator.optionsForUi()).toEqual([
      { value: "square_2d_open", label: "Open edges", rank: 2 },
      { value: "square_2d_periodic", label: "Periodic (torus)", rank: 2 },
      { value: "cubic_3d_open", label: "Open cube", rank: 3 },
      { value: "cubic_3d_periodic", label: "Periodic cube", rank: 3 },
    ]);
  });

  it("returns default dimensions for a preset", () => {
    expect(GeometryOrchestrator.defaultDimensions("square_2d_open")).toEqual([
      LATTICE_SIZE.defaultWidth,
      LATTICE_SIZE.defaultHeight,
    ]);
    expect(GeometryOrchestrator.defaultDimensions("cubic_3d_open")).toEqual([
      LATTICE_SIZE.defaultDepth,
      LATTICE_SIZE.defaultDepth,
      LATTICE_SIZE.defaultDepth,
    ]);
  });

  it("rejects invalid dimensions before creating a layout", () => {
    expect(() =>
      GeometryOrchestrator.create("square_2d_open", [2, 16]),
    ).toThrow(SimulationError);
  });

  it("rejects lattices above the max volume", () => {
    expect(() =>
      GeometryOrchestrator.create("cubic_3d_open", [32, 32, 33]),
    ).toThrow(SimulationError);
  });

  it("creates 2D layouts with the same neighbor topology as direct implementations", () => {
    const layout = GeometryOrchestrator.create("square_2d_open", [4, 4]);
    const direct = new Square2DOpen(4, 4);

    for (let site = 0; site < layout.numSites(); site += 1) {
      expect(layout.neighbors(site)).toEqual(direct.neighbors(site));
      expect(layout.indexToCoord(site)).toEqual(direct.indexToCoord(site));
    }
  });

  it("creates 3D layouts with the same neighbor topology as direct implementations", () => {
    const layout = GeometryOrchestrator.create("cubic_3d_periodic", [4, 4, 4]);
    const direct = new Cubic3DPeriodic(4, 4, 4);

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

  it("creates an 8x8x8 cubic layout", () => {
    const layout = GeometryOrchestrator.create("cubic_3d_open", [8, 8, 8]);
    expect(layout.numSites()).toBe(512);
    expect(layout.maxNeighbors()).toBe(6);
    expect(layout.neighbors(0)).toEqual(new Cubic3DOpen(8, 8, 8).neighbors(0));
  });
});
