/**
 * Deterministic, seedable PRNG (sfc32 seeded via splitmix32).
 * Every source of randomness in the simulation must go through this class so
 * that the same seed reproduces the same life.
 */
export interface WeightedItem<T> {
  item: T;
  weight: number;
}

function splitmix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export class SeededRandom {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    const init = splitmix32(this.seed);
    this.a = init();
    this.b = init();
    this.c = init();
    this.d = init();
    for (let i = 0; i < 12; i++) this.nextUint32();
  }

  private nextUint32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Weighted pick. Items with weight <= 0 are never selected. */
  weighted<T>(items: WeightedItem<T>[]): T {
    const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
    if (items.length === 0 || total <= 0) {
      throw new Error("SeededRandom.weighted: no item has positive weight");
    }
    let roll = this.next() * total;
    for (const entry of items) {
      const w = Math.max(0, entry.weight);
      if (roll < w) return entry.item;
      roll -= w;
    }
    return items.filter((i) => i.weight > 0).at(-1)!.item;
  }

  /** Weighted sampling of up to `count` distinct items without replacement. */
  weightedSample<T>(items: WeightedItem<T>[], count: number): T[] {
    const pool = items.filter((i) => i.weight > 0);
    const out: T[] = [];
    while (out.length < count && pool.length > 0) {
      const picked = this.weighted(pool.map((item, index) => ({ item: index, weight: item.weight })));
      out.push(pool[picked].item);
      pool.splice(picked, 1);
    }
    return out;
  }

  /** Derive an independent child stream (e.g. one per subsystem). */
  fork(label: string): SeededRandom {
    let h = this.seed ^ 0x811c9dc5;
    for (let i = 0; i < label.length; i++) {
      h = Math.imul(h ^ label.charCodeAt(i), 0x01000193) >>> 0;
    }
    return new SeededRandom(h ^ this.nextUint32());
  }
}
