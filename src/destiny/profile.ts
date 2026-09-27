/**
 * DestinyProfile — the one call a game needs.
 *
 *   const d = createDestinyProfile({ birth, place?, mbti? });
 *   d.modifiersAt({ year, month })   // hidden SAJU + ASTROLOGY + MBTI blend
 *   d.traits                          // personality for decisions
 *
 * Everything is computed silently from the birth data; nothing needs to be
 * shown to the player. Sources stay separate internally (for debugging and
 * balancing) and are merged only here.
 */
import type { GameDate } from "../core/gameDate";
import { type DestinyModifierSource, type LifeModifiers, mergeModifierSources } from "../core/lifeModifiers";
import type { BirthData } from "../saju/calendar/fourPillars";
import { type SajuChart, calculateNatalChart } from "../saju/chart";
import { SajuModifierEngine } from "../saju/interpretation/sajuModifierEngine";
import { type AstrologyChart, type BirthPlace, DEFAULT_BIRTHPLACE, calculateAstrologyChart } from "../astrology/chart";
import { AstrologyModifierEngine } from "../astrology/interpretation";
import { type MbtiType, type Persona, mbtiModifierSource, parseMbti, personaFromMbti, traitsFromPersona } from "../mbti/mbti";
import type { Traits } from "../sim/types";

export interface DestinyInput {
  birth: BirthData;
  place?: BirthPlace;
  mbti?: string;
  /** Relative influence per system (default 1 each). */
  weights?: Partial<Record<"SAJU" | "ASTROLOGY" | "MBTI", number>>;
  /** Seed for persona jitter (two ENFPs aren't identical). */
  seed?: number;
}

export interface DestinyProfile {
  saju: SajuChart;
  astrology: AstrologyChart;
  mbti?: MbtiType;
  persona?: Persona;
  /** Traits for decision policies (from MBTI; neutral 0.5s when unknown). */
  traits: Traits;
  /** Separate sources at a date (for OpportunityEngine / debug). */
  sourcesAt(date: GameDate): DestinyModifierSource[];
  /** Merged hidden modifiers at a date. */
  modifiersAt(date: GameDate): LifeModifiers;
}

const sajuEngine = new SajuModifierEngine();
const astroEngine = new AstrologyModifierEngine();

export function createDestinyProfile(input: DestinyInput): DestinyProfile {
  const saju = calculateNatalChart(input.birth);
  const astrology = calculateAstrologyChart(input.birth, input.place ?? DEFAULT_BIRTHPLACE);
  const mbti = input.mbti ? parseMbti(input.mbti) : undefined;
  const persona = mbti ? personaFromMbti(mbti, input.seed ?? 0) : undefined;
  const traits: Traits = persona ? traitsFromPersona(persona) : { riskTolerance: 0.5, novelty: 0.5, sociability: 0.5, ambition: 0.5 };
  const w = { SAJU: 1, ASTROLOGY: 1, MBTI: 1, ...input.weights };
  const mbtiSource = mbti ? mbtiModifierSource(mbti, w.MBTI) : undefined;
  const cache = new Map<string, DestinyModifierSource[]>();

  const sourcesAt = (date: GameDate) => {
    const key = `${date.year}-${date.month}`;
    let s = cache.get(key);
    if (!s) {
      s = [
        sajuEngine.toModifierSource(sajuEngine.calculateDetailed(saju, date), w.SAJU),
        astroEngine.toModifierSource(astroEngine.calculateDetailed(astrology, date), w.ASTROLOGY),
        ...(mbtiSource ? [mbtiSource] : []),
      ];
      if (cache.size > 240) cache.clear();
      cache.set(key, s);
    }
    return s;
  };
  return { saju, astrology, mbti, persona, traits, sourcesAt, modifiersAt: (d) => mergeModifierSources(sourcesAt(d)) };
}
