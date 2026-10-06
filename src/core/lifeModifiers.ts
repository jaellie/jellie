/**
 * Shared modifier vocabulary for every destiny/personality/world system
 * (Saju now; Astrology and MBTI later).
 *
 * Convention: a LifeModifiers value is an additive *log-scale delta* around 0.
 *   0     → neutral
 *   +0.25 → the related opportunities are ~1.28× as likely (exp(0.25))
 *   -0.25 → ~0.78× as likely
 * Deltas from independent sources are simply summed, which makes the
 * resulting multipliers compose multiplicatively and order-independently.
 */
export const LIFE_MODIFIER_KEYS = [
  "romance",
  "marriage",
  "career",
  "education",
  "wealth",
  "business",
  "social",
  "family",
  "mobility",
  "travel",
  "relocation",
  "overseas",
  "stability",
  "change",
  "risk",
  "creativity",
  "communication",
  "introspection",
  "opportunity",
  "volatility",
] as const;

export type LifeModifierKey = (typeof LIFE_MODIFIER_KEYS)[number];
export type LifeModifiers = Record<LifeModifierKey, number>;

/** One traceable contribution to a modifier. */
export interface Modifier {
  key: LifeModifierKey;
  value: number;
  /** Human-readable origin, e.g. "SAJU/shinsal/YEOKMA" or "WORLD/finances". */
  source: string;
}

export type DestinySystem = "SAJU" | "ASTROLOGY" | "MBTI";

export interface DestinyModifierSource {
  source: DestinySystem | string;
  modifiers: Partial<LifeModifiers>;
  /** Relative influence of this source when merged (default 1). */
  weight?: number;
  /** Optional detailed trace for debug views. */
  breakdown?: Modifier[];
}

/** Hard cap per key after merging, so no single system can dominate. */
export const MODIFIER_CLAMP = 1.5;

export function emptyModifiers(): LifeModifiers {
  const out = {} as LifeModifiers;
  for (const k of LIFE_MODIFIER_KEYS) out[k] = 0;
  return out;
}

export function isLifeModifierKey(key: string): key is LifeModifierKey {
  return (LIFE_MODIFIER_KEYS as readonly string[]).includes(key);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Sum any number of (partial) modifier sets, then clamp each key. */
export function combineModifiers(...sets: Array<Partial<LifeModifiers> | undefined>): LifeModifiers {
  const out = emptyModifiers();
  for (const set of sets) {
    if (!set) continue;
    for (const key of LIFE_MODIFIER_KEYS) out[key] += set[key] ?? 0;
  }
  for (const key of LIFE_MODIFIER_KEYS) out[key] = clamp(out[key], -MODIFIER_CLAMP, MODIFIER_CLAMP);
  return out;
}

/** Weighted merge of independent sources (SAJU + ASTROLOGY + MBTI …). */
export function mergeModifierSources(sources: DestinyModifierSource[]): LifeModifiers {
  return combineModifiers(...sources.map((s) => scaleModifiers(s.modifiers, s.weight ?? 1)));
}

export function scaleModifiers(set: Partial<LifeModifiers>, factor: number): Partial<LifeModifiers> {
  const out: Partial<LifeModifiers> = {};
  for (const key of LIFE_MODIFIER_KEYS) {
    if (set[key] !== undefined) out[key] = set[key]! * factor;
  }
  return out;
}

/** Collapse a trace of Modifier entries into LifeModifiers (unclamped sum). */
export function sumModifierList(list: Modifier[]): LifeModifiers {
  const out = emptyModifiers();
  for (const m of list) out[m.key] += m.value;
  return out;
}

/** Log-delta → probability multiplier. */
export function toMultiplier(delta: number): number {
  return Math.exp(delta);
}
