/**
 * NPC names that fit the language and the place.
 *
 *  - Stored once, in their Korean form (foreign names in Hangul: 엠마, 하루토), so Korean text and
 *    particles read naturally ("카미유와 수다를 떨었다").
 *  - The English UI shows each name's English pair (서준 → Noah, 하루토 → Haruto): see nameEn().
 *  - The place decides the style: Korea → Korean names, Tokyo → Japanese, Paris → French, abroad
 *    elsewhere → that country's names (or English-speaking ones).
 *  - Always the right gender for the person (a boyfriend is never 예린).
 */
import data from "../../data/world/names.json";
import type { SeededRandom } from "../core/rng";

export type Sex = "MALE" | "FEMALE";
type Pair = { ko: string; en: string };
type Culture = keyof typeof data.cultures;

const CULTURES = data.cultures as Record<string, Record<Sex, Pair[]>>;
const COUNTRY_CULTURE = data.countries as Record<string, string>;

/** Korean form → English form, for every generated name (people and pets). */
const NAME_EN: Record<string, string> = {};
for (const c of Object.values(CULTURES)) for (const list of Object.values(c)) for (const p of list) NAME_EN[p.ko] = p.en;
for (const list of Object.values(data.pets as Record<string, Pair[]>)) for (const p of list) NAME_EN[p.ko] = p.en;

export function nameEn(name: string): string | undefined {
  return NAME_EN[name];
}

/** English form → stored (Korean) form, and the sex the name belongs to (a baby named in the English UI). */
const NAME_KO: Record<string, { ko: string; sex: Sex }> = {};
for (const c of Object.values(CULTURES)) for (const [sex, list] of Object.entries(c)) for (const p of list) (NAME_KO[p.en] = { ko: p.ko, sex: sex as Sex }), (NAME_KO[p.ko] = { ko: p.ko, sex: sex as Sex });
export function nameKo(name: string): { ko: string; sex: Sex } | undefined {
  return NAME_KO[name];
}

/** The name culture of a country ("Japan" / "JP" → JP; Korea → KR; anywhere else → English-speaking). */
export function cultureOf(country: string | undefined): Culture {
  if (!country) return "KR";
  return (COUNTRY_CULTURE[country] ?? "ANGLO") as Culture;
}

/** A fresh name for someone of this sex from this culture, avoiding names already in use. */
export function pickName(sex: Sex, culture: string, rng: SeededRandom, avoid: Iterable<string | undefined> = []): string {
  const pool = (CULTURES[culture] ?? CULTURES.KR)[sex];
  const taken = new Set(avoid);
  const free = pool.filter((p) => !taken.has(p.ko));
  const from = free.length ? free : pool;
  return from[rng.int(0, from.length - 1)].ko;
}

export function petName(species: "DOG" | "CAT", rng: SeededRandom): string {
  const pool = (data.pets as Record<string, Pair[]>)[species];
  return pool[rng.int(0, pool.length - 1)].ko;
}
