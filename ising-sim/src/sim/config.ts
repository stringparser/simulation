import { DEFAULT_GEOMETRY, type GeometryName, isGeometryName } from "../config/geometries";
import { LATTICE_SIZE, validateDimensions } from "../config/lattice";
import { SIMULATION_DEFAULTS } from "../config/simulationParams";
import { SimulationError } from "./errors";
import { GeometryOrchestrator } from "./geometry/orchestrator";

export interface SimConfig {
  dimensions: readonly number[];
  temperature: number;
  field: number;
  coupling: number;
  geometry: GeometryName;
  seed?: number;
}

export interface SimInitParams {
  dimensions?: readonly number[];
  width?: number;
  height?: number;
  geometry?: string;
  temperature?: number;
  field?: number;
  coupling?: number;
  seed?: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  dimensions: GeometryOrchestrator.defaultDimensions(DEFAULT_GEOMETRY),
  temperature: SIMULATION_DEFAULTS.temperature,
  field: SIMULATION_DEFAULTS.field,
  coupling: SIMULATION_DEFAULTS.coupling,
  geometry: DEFAULT_GEOMETRY,
};

export function beta(config: SimConfig): number {
  return 1 / config.temperature;
}

export function validateLatticeSize(width: number, height: number): void {
  validateDimensions([width, height]);
}

export function initParamsToConfig(params: SimInitParams = {}): SimConfig {
  let geometry: GeometryName = DEFAULT_GEOMETRY;
  if (params.geometry !== undefined) {
    if (!isGeometryName(params.geometry)) {
      throw SimulationError.unsupportedGeometry(params.geometry);
    }
    geometry = params.geometry;
  }

  const dimensions =
    params.dimensions ??
    [
      params.width ?? LATTICE_SIZE.defaultWidth,
      params.height ?? LATTICE_SIZE.defaultHeight,
    ];

  GeometryOrchestrator.validate(geometry, dimensions);

  const temperature = params.temperature ?? SIMULATION_DEFAULTS.temperature;
  if (temperature <= 0) {
    throw SimulationError.invalidTemperature();
  }

  return {
    dimensions,
    temperature,
    field: params.field ?? SIMULATION_DEFAULTS.field,
    coupling: params.coupling ?? SIMULATION_DEFAULTS.coupling,
    geometry,
    seed: params.seed,
  };
}
