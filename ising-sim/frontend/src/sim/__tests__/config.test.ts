import { LATTICE_SIZE } from "../../config/lattice";
import { initParamsToConfig, validateLatticeSize } from "../config";
import { SimulationError } from "../errors";

describe("sim config", () => {
  it("rejects lattice size outside bounds", () => {
    expect(() => validateLatticeSize(3, 16)).toThrow(SimulationError);
    expect(() => validateLatticeSize(16, 65)).toThrow(SimulationError);
    expect(() => validateLatticeSize(32, 32)).not.toThrow();
  });

  it("defaults to a 16 by 16 open lattice", () => {
    const config = initParamsToConfig();
    expect(config.width).toBe(LATTICE_SIZE.defaultWidth);
    expect(config.height).toBe(LATTICE_SIZE.defaultHeight);
    expect(config.geometry).toBe("square_2d_open");
  });

  it("rejects unsupported geometry names", () => {
    expect(() => initParamsToConfig({ geometry: "hex_grid" })).toThrow(SimulationError);
  });

  it("rejects non-positive temperature", () => {
    expect(() => initParamsToConfig({ temperature: 0 })).toThrow(SimulationError);
  });
});
