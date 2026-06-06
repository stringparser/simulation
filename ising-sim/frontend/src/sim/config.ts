import { DEFAULT_GEOMETRY, type GeometryName, isGeometryName } from "../config/geometries";
import { LATTICE_SIZE } from "../config/lattice";
import { SIMULATION_DEFAULTS } from "../config/simulationParams";
import { SimulationError } from "./errors";

export interface SimConfig {
  width: number;
  height: number;
  temperature: number;
  field: number;
  coupling: number;
  geometry: GeometryName;
  seed?: number;
}

export interface SimInitParams {
  width?: number;
  height?: number;
  geometry?: string;
  temperature?: number;
  field?: number;
  coupling?: number;
  seed?: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  width: LATTICE_SIZE.defaultWidth,
  height: LATTICE_SIZE.defaultHeight,
  temperature: SIMULATION_DEFAULTS.temperature,
  field: SIMULATION_DEFAULTS.field,
  coupling: SIMULATION_DEFAULTS.coupling,
  geometry: DEFAULT_GEOMETRY,
};

export function beta(config: SimConfig): number {
  return 1 / config.temperature;
}

export function validateLatticeSize(width: number, height: number): void {
  const valid =
    width >= LATTICE_SIZE.min &&
    height >= LATTICE_SIZE.min &&
    width <= LATTICE_SIZE.max &&
    height <= LATTICE_SIZE.max;

  if (!valid) {
    throw SimulationError.invalidLatticeSize(width, height);
  }
}

export function initParamsToConfig(params: SimInitParams = {}): SimConfig {
  const width = params.width ?? LATTICE_SIZE.defaultWidth;
  const height = params.height ?? LATTICE_SIZE.defaultHeight;
  validateLatticeSize(width, height);

  const temperature = params.temperature ?? SIMULATION_DEFAULTS.temperature;
  if (temperature <= 0) {
    throw SimulationError.invalidTemperature();
  }

  let geometry: GeometryName = DEFAULT_GEOMETRY;
  if (params.geometry !== undefined) {
    if (!isGeometryName(params.geometry)) {
      throw SimulationError.unsupportedGeometry(params.geometry);
    }
    geometry = params.geometry;
  }

  return {
    width,
    height,
    temperature,
    field: params.field ?? SIMULATION_DEFAULTS.field,
    coupling: params.coupling ?? SIMULATION_DEFAULTS.coupling,
    geometry,
    seed: params.seed,
  };
}
