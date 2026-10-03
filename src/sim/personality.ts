/**
 * Placeholder personality source until MBTI lands. It produces the SAME kind
 * of DestinyModifierSource as Saju, proving the composition path.
 */
import type { DestinyModifierSource } from "../core/lifeModifiers";
import type { Traits } from "./types";

export function traitsToModifierSource(t: Traits, weight = 1): DestinyModifierSource {
  const c = (x: number) => (x - 0.5) * 2; // −1..1
  return {
    source: "PERSONALITY",
    weight,
    modifiers: {
      travel: 0.12 * c(t.novelty),
      change: 0.1 * c(t.novelty),
      overseas: 0.08 * c(t.novelty),
      social: 0.12 * c(t.sociability),
      romance: 0.08 * c(t.sociability),
      risk: 0.1 * c(t.riskTolerance),
      business: 0.08 * c(t.riskTolerance),
      career: 0.08 * c(t.ambition),
      education: 0.06 * c(t.ambition),
    },
  };
}
