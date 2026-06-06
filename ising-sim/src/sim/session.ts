import type { GeometryName } from "../config/geometries";
import { initParamsToConfig, type SimConfig, type SimInitParams } from "./config";
import { SimulationError } from "./errors";
import { GeometryOrchestrator, type GeometryInstance } from "./geometry";
import { NearestNeighbor } from "./interaction";
import { Lattice } from "./lattice";
import { energy, magnetization } from "./metrics";
import { acceptanceRate, sweep, type SweepStats } from "./monteCarlo";
import { SeededRng, sessionRngSeed } from "./rng";

export interface SessionSnapshot {
  spins: number[];
  dimensions: readonly number[];
  rank: number;
  maxNeighbors: number;
  step: number;
  geometry: GeometryName;
}

export interface SessionMetrics {
  energy: number;
  magnetization: number;
  acceptanceRate: number | null;
  temperature: number;
  field: number;
  coupling: number;
}

export class SimulationSession {
  private readonly layout: GeometryInstance;
  private interaction: NearestNeighbor;
  private readonly lattice: Lattice;
  private config: SimConfig;
  private readonly rng: SeededRng;
  private step = 0;
  private running = false;
  private sweepsPerTick = 1;
  private lastAcceptanceRate: number | null = null;
  private cachedSnapshot: SessionSnapshot;

  private constructor(
    layout: GeometryInstance,
    interaction: NearestNeighbor,
    lattice: Lattice,
    config: SimConfig,
    rng: SeededRng,
  ) {
    this.layout = layout;
    this.interaction = interaction;
    this.lattice = lattice;
    this.config = config;
    this.rng = rng;
    this.cachedSnapshot = {
      spins: [],
      dimensions: [...layout.dimensions],
      rank: layout.definition.rank,
      maxNeighbors: layout.maxNeighbors(),
      step: 0,
      geometry: layout.definition.name,
    };
    this.refreshSnapshot();
  }

  static create(params: SimInitParams = {}): SimulationSession {
    const config = initParamsToConfig(params);
    const layout = GeometryOrchestrator.create(config.geometry, config.dimensions);
    const interaction = new NearestNeighbor(config.coupling);
    const lattice = Lattice.create(layout.numSites(), config.seed);
    const rngSeed = sessionRngSeed(config.seed);
    const rng =
      rngSeed === undefined
        ? new SeededRng(Date.now() >>> 0)
        : SeededRng.fromSeed(rngSeed);

    return new SimulationSession(layout, interaction, lattice, config, rng);
  }

  start(stepsPerTick = 1): void {
    this.sweepsPerTick = Math.max(1, stepsPerTick);
    this.running = true;
  }

  pause(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getSweepsPerTick(): number {
    return this.sweepsPerTick;
  }

  setParams(params: {
    temperature?: number;
    field?: number;
    coupling?: number;
  }): void {
    if (params.temperature !== undefined) {
      if (params.temperature <= 0) {
        throw SimulationError.invalidTemperature();
      }
      this.config.temperature = params.temperature;
    }
    if (params.field !== undefined) {
      this.config.field = params.field;
    }
    if (params.coupling !== undefined) {
      this.config.coupling = params.coupling;
      this.interaction = new NearestNeighbor(params.coupling);
    }
  }

  runSweeps(sweeps: number): SweepStats {
    if (sweeps <= 0) {
      throw SimulationError.invalidStep(sweeps);
    }

    const total: SweepStats = { attempts: 0, acceptances: 0 };
    for (let sweepIndex = 0; sweepIndex < sweeps; sweepIndex += 1) {
      const stats = sweep(
        this.lattice,
        this.layout.core,
        this.interaction,
        this.config,
        this.rng,
      );
      total.attempts += stats.attempts;
      total.acceptances += stats.acceptances;
      this.step += 1;
    }

    this.lastAcceptanceRate = acceptanceRate(total);
    return total;
  }

  getSnapshot(): SessionSnapshot {
    this.refreshSnapshot();
    return {
      spins: [...this.cachedSnapshot.spins],
      dimensions: [...this.cachedSnapshot.dimensions],
      rank: this.cachedSnapshot.rank,
      maxNeighbors: this.cachedSnapshot.maxNeighbors,
      step: this.cachedSnapshot.step,
      geometry: this.cachedSnapshot.geometry,
    };
  }

  getMetrics(): SessionMetrics {
    return {
      energy: energy(this.lattice, this.layout.core, this.interaction, this.config),
      magnetization: magnetization(this.lattice),
      acceptanceRate: this.lastAcceptanceRate,
      temperature: this.config.temperature,
      field: this.config.field,
      coupling: this.config.coupling,
    };
  }

  private refreshSnapshot(): void {
    this.cachedSnapshot.spins = this.lattice.spinsArray();
    this.cachedSnapshot.dimensions = [...this.layout.dimensions];
    this.cachedSnapshot.rank = this.layout.definition.rank;
    this.cachedSnapshot.maxNeighbors = this.layout.maxNeighbors();
    this.cachedSnapshot.step = this.step;
    this.cachedSnapshot.geometry = this.layout.definition.name;
  }
}
