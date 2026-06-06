import { SimulationError } from "./errors";
import { SeededRng } from "./rng";

export class Lattice {
  private readonly spins: Int8Array;

  private constructor(spins: Int8Array) {
    this.spins = spins;
  }

  static create(numSites: number, seed?: number): Lattice {
    const spins = new Int8Array(numSites);
    const rng =
      seed === undefined ? new SeededRng(Date.now() >>> 0) : SeededRng.fromSeed(seed);

    for (let site = 0; site < numSites; site += 1) {
      spins[site] = rng.nextBool() ? 1 : -1;
    }

    return new Lattice(spins);
  }

  static fromSpins(spins: readonly number[]): Lattice {
    if (!spins.every((spin) => spin === 1 || spin === -1)) {
      throw SimulationError.invalidSpins();
    }
    return new Lattice(Int8Array.from(spins));
  }

  get length(): number {
    return this.spins.length;
  }

  spin(site: number): number {
    return this.spins[site];
  }

  spinValues(): Int8Array {
    return this.spins;
  }

  spinsArray(): number[] {
    return Array.from(this.spins);
  }

  flip(site: number): void {
    this.spins[site] = this.spins[site] === 1 ? -1 : 1;
  }
}
