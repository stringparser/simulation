import { LATTICE_SIZE } from "../config/lattice";

export type SimulationErrorCode =
  | "invalid_lattice_size"
  | "init_failed"
  | "invalid_params"
  | "invalid_step"
  | "not_initialized"
  | "invalid_spins";

export class SimulationError extends Error {
  readonly code: SimulationErrorCode;

  constructor(message: string, code: SimulationErrorCode) {
    super(message);
    this.name = "SimulationError";
    this.code = code;
  }

  static invalidLatticeSize(width: number, height: number): SimulationError {
    return new SimulationError(
      `lattice size must be between ${LATTICE_SIZE.min} and ${LATTICE_SIZE.max}, got ${width}x${height}`,
      "invalid_lattice_size",
    );
  }

  static unsupportedGeometry(name: string): SimulationError {
    return new SimulationError(`unsupported geometry: ${name}`, "init_failed");
  }

  static invalidTemperature(): SimulationError {
    return new SimulationError("temperature must be positive", "invalid_params");
  }

  static invalidStep(sweeps: number): SimulationError {
    return new SimulationError(`sweeps must be at least 1, got ${sweeps}`, "invalid_step");
  }

  static notInitialized(): SimulationError {
    return new SimulationError(
      "simulation not initialized; send init first",
      "not_initialized",
    );
  }

  static invalidSpins(): SimulationError {
    return new SimulationError("spins must be +1 or -1", "invalid_spins");
  }
}
