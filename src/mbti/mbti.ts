/**
 * MBTI personality system.
 *
 *   MBTI type ─► Persona (11 dimensions, prototype-compatible, seeded jitter)
 *            ─► Traits (used by decision policies & world encounters: HOW you choose)
 *            ─► "MBTI" DestinyModifierSource (WHAT tends to come your way)
 */
import data from "../../data/mbti/mbti.json";
import { type DestinyModifierSource, type Modifier, clamp, isLifeModifierKey, sumModifierList } from "../core/lifeModifiers";
import { SeededRandom } from "../core/rng";
import type { Traits } from "../sim/types";

export type MbtiLetter = "E" | "I" | "N" | "S" | "T" | "F" | "J" | "P";
export interface MbtiType {
  code: string; // "ENFP"
  letters: [MbtiLetter, MbtiLetter, MbtiLetter, MbtiLetter];
  identity?: "A" | "T";
}

export interface Persona {
  socialEnergy: number;
  socialInitiation: number;
  noveltySeeking: number;
  emotionalExpression: number;
  conflictAvoidance: number;
  planning: number;
  riskTolerance: number;
  independence: number;
  relationshipPacing: number;
  creativity: number;
  careerDrive: number;
  spontaneity: number;
}

const AXES: Array<[MbtiLetter, MbtiLetter]> = [["E", "I"], ["N", "S"], ["T", "F"], ["J", "P"]];

/** Accepts "enfp", "ENFP", "ENFP-T", "INTJ-A". */
export function parseMbti(input: string): MbtiType {
  const m = /^([EI])([NS])([TF])([JP])(?:-([AT]))?$/i.exec(input.trim());
  if (!m) throw new Error(`Invalid MBTI "${input}"`);
  const letters = [m[1], m[2], m[3], m[4]].map((x) => x.toUpperCase()) as MbtiType["letters"];
  return { code: letters.join(""), letters, identity: m[5]?.toUpperCase() as MbtiType["identity"] };
}

export function isValidMbti(input: string): boolean {
  try {
    parseMbti(input);
    return true;
  } catch {
    return false;
  }
}

/** Personality dimensions. Same type + same seed ⇒ same persona; two ENFPs still differ a little. */
export function personaFromMbti(mbti: MbtiType | string, seed = 0): Persona {
  const t = typeof mbti === "string" ? parseMbti(mbti) : mbti;
  const has = (l: MbtiLetter) => t.letters.includes(l);
  const rng = new SeededRandom(seed ^ [...t.code].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261));
  const j = (v: number) => clamp(v + rng.range(-data.jitter, data.jitter), 0.05, 0.95);
  const p = {} as Persona;
  for (const [dim, table] of Object.entries(data.baseline) as Array<[keyof Persona, Record<string, number>]>) {
    const letter = Object.keys(table).find((l) => has(l as MbtiLetter))!;
    p[dim] = j(table[letter]);
  }
  for (const [dim, spec] of Object.entries(data.composite) as Array<[keyof Persona, Record<string, number>]>) {
    let v = spec.base;
    for (const [l, d] of Object.entries(spec)) if (l !== "base" && has(l as MbtiLetter)) v += d;
    p[dim] = j(v);
  }
  p.spontaneity = 1 - p.planning;
  return p;
}

/** Map persona → the Traits the simulation's decision policies use. */
export function traitsFromPersona(p: Persona): Traits {
  return {
    riskTolerance: p.riskTolerance,
    novelty: p.noveltySeeking,
    sociability: p.socialEnergy,
    ambition: p.careerDrive,
    persona: p,
  };
}

export function mbtiModifierSource(mbti: MbtiType | string, weight = 1): DestinyModifierSource {
  const t = typeof mbti === "string" ? parseMbti(mbti) : mbti;
  const trace: Modifier[] = [];
  const add = (deltas: Record<string, number> | undefined, src: string) => {
    for (const [k, v] of Object.entries(deltas ?? {})) if (isLifeModifierKey(k)) trace.push({ key: k, value: v, source: `MBTI/${src}` });
  };
  for (const l of t.letters) add((data.letters as Record<string, Record<string, number>>)[l], `${t.code}/${l}`);
  if (t.identity) add((data.identity as Record<string, Record<string, number>>)[t.identity], `identity-${t.identity}`);
  return { source: "MBTI", weight, modifiers: sumModifierList(trace), breakdown: trace };
}

export { AXES as MBTI_AXES };
