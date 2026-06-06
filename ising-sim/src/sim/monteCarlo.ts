import { beta, type SimConfig } from "./config";
import type { Geometry } from "./geometry";
import type { Interaction } from "./interaction";
import type { Lattice } from "./lattice";
import { SeededRng } from "./rng";

export interface SweepStats {
  attempts: number;
  acceptances: number;
}

export function acceptanceRate(stats: SweepStats): number {
  return stats.attempts === 0 ? 0 : stats.acceptances / stats.attempts;
}

export function sweep(
  lattice: Lattice,
  geometry: Geometry,
  interaction: Interaction,
  config: SimConfig,
  rng: SeededRng,
): SweepStats {
  const numSites = geometry.numSites();
  const inverseTemperature = beta(config);
  const stats: SweepStats = { attempts: 0, acceptances: 0 };

  for (let attempt = 0; attempt < numSites; attempt += 1) {
    const site = rng.nextInt(numSites);
    const delta = interaction.deltaEnergy(lattice, site, geometry, config.field);
    stats.attempts += 1;

    if (delta <= 0 || rng.nextFloat() < Math.exp(-inverseTemperature * delta)) {
      lattice.flip(site);
      stats.acceptances += 1;
    }
  }

  return stats;
}

export function runSweeps(
  lattice: Lattice,
  geometry: Geometry,
  interaction: Interaction,
  config: SimConfig,
  sweeps: number,
  seed?: number,
): SweepStats {
  const rng =
    seed === undefined
      ? new SeededRng(Date.now() >>> 0)
      : SeededRng.fromSeed(seed);
  const total: SweepStats = { attempts: 0, acceptances: 0 };

  for (let sweepIndex = 0; sweepIndex < sweeps; sweepIndex += 1) {
    const stats = sweep(lattice, geometry, interaction, config, rng);
    total.attempts += stats.attempts;
    total.acceptances += stats.acceptances;
  }

  return total;
}
