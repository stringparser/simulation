/** Deterministic PRNG for reproducible simulations (mulberry32). */
export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  static fromSeed(seed: number): SeededRng {
    return new SeededRng(seed);
  }

  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.nextFloat() * maxExclusive);
  }

  nextBool(probability = 0.5): boolean {
    return this.nextFloat() < probability;
  }
}

/** Session RNG uses a different seed offset than lattice initialization. */
export function sessionRngSeed(seed: number | undefined): number | undefined {
  return seed === undefined ? undefined : (seed + 1) >>> 0;
}
