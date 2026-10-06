/**
 * OpportunityEngine — turns (destiny modifiers × world circumstances) into a
 * pool of weighted, *optional* opportunities.
 *
 *   score = base
 *         × Π_source exp(Σ_k affinity_k × delta_source,k)   (SAJU, ASTROLOGY, MBTI, PERSONALITY…)
 *         × lifeStage × relationship × financial × family × world × history
 *         × randomness
 *
 * No source is special-cased: Saju is just one DestinyModifierSource.
 */
import templateData from "../../data/sim/opportunities.json";
import { addMonths } from "../core/gameDate";
import { type DestinyModifierSource, type LifeModifierKey, type Modifier, clamp } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import type { Opportunity, OpportunityTemplate, ScoreFactor } from "./opportunity";
import { checkRequirements } from "./requirements";
import { type LifeState, isAbroad } from "./types";

export const DEFAULT_TEMPLATES: OpportunityTemplate[] = templateData.templates as unknown as OpportunityTemplate[];
export const MAX_PROBABILITY = 0.9;
const HISTORY_WINDOW_MONTHS = 36;

export interface OpportunityCandidate {
  template: OpportunityTemplate;
  opportunity: Opportunity;
  /** Fills `opportunity.modifiers` and per-source factor details (lazy; cheap to skip). */
  explain(): Opportunity;
}

function sourceDelta(t: OpportunityTemplate, src: DestinyModifierSource): number {
  const weight = src.weight ?? 1;
  let delta = 0;
  for (const [key, aff] of Object.entries(t.affinity) as Array<[LifeModifierKey, number]>) delta += aff * (src.modifiers[key] ?? 0) * weight;
  return delta;
}

/** Explain a source factor: which modifier origins drove it (computed only for surfaced opportunities). */
function explainSource(t: OpportunityTemplate, src: DestinyModifierSource): { details: ScoreFactor["details"]; modifiers: Modifier[] } {
  const weight = src.weight ?? 1;
  const byLabel = new Map<string, number>();
  const modifiers: Modifier[] = [];
  const entries: Modifier[] = src.breakdown ?? (Object.entries(src.modifiers).map(([key, value]) => ({ key, value, source: src.source })) as Modifier[]);
  for (const m of entries) {
    const aff = t.affinity[m.key];
    if (!aff) continue;
    const v = aff * m.value * weight;
    modifiers.push({ key: m.key, value: v, source: m.source });
    const label = `${m.key} ← ${m.source}`;
    byLabel.set(label, (byLabel.get(label) ?? 0) + v);
  }
  const details = [...byLabel.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((d) => Math.abs(d.value) >= 0.005)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6);
  return { details, modifiers };
}

export function circumstanceFactors(t: OpportunityTemplate, s: LifeState): ScoreFactor[] {
  const c = t.circumstances ?? {};
  const out: ScoreFactor[] = [];
  if (c.agePeak !== undefined) {
    const z = (s.age - c.agePeak) / (c.ageSpread ?? 5);
    out.push({ name: "LIFE_STAGE", value: 0.4 + 0.8 * Math.exp(-0.5 * z * z) });
  }
  if (c.relationship?.[s.relationship.status] !== undefined) out.push({ name: "RELATIONSHIP", value: c.relationship[s.relationship.status]! });
  if (c.longDistance && s.relationship.longDistance) out.push({ name: "RELATIONSHIP", value: c.longDistance });
  if (c.cost) {
    const available = Math.max(0, s.money) + s.familySupport * c.cost * 0.8;
    out.push({ name: "FINANCES", value: 0.6 + 0.6 * Math.min(1, available / c.cost) });
  }
  if (c.familyObligationPenalty) out.push({ name: "FAMILY", value: Math.max(0.2, 1 - c.familyObligationPenalty * s.familyObligation) });
  if (c.abroad && isAbroad(s)) out.push({ name: "WORLD", value: c.abroad });
  if (c.home && !isAbroad(s)) out.push({ name: "WORLD", value: c.home });
  if (s.flags.frequentTraveler && t.type === "MOBILITY") out.push({ name: "CAREER", value: 1.3 });
  const offered = (s.history[t.id]?.offered ?? []).filter((m) => s.monthIndex - m < HISTORY_WINDOW_MONTHS).length;
  if (offered > 0) out.push({ name: "HISTORY", value: 1 / (1 + 0.35 * offered) });
  return out;
}

export class OpportunityEngine {
  constructor(private readonly templates: OpportunityTemplate[] = DEFAULT_TEMPLATES) {}

  eligibleTemplates(s: LifeState): OpportunityTemplate[] {
    return this.templates.filter((t) => {
      if (!checkRequirements(s, t.requirements).ok) return false;
      const h = s.history[t.id];
      if (t.maxTimesTaken !== undefined && (h?.taken.length ?? 0) >= t.maxTimesTaken) return false;
      const last = h?.offered.at(-1);
      return last === undefined || s.monthIndex - last >= t.cooldownMonths;
    });
  }

  /** Score every eligible template. Does not roll — that's the EventEngine's job. */
  evaluate(s: LifeState, sources: DestinyModifierSource[], rng: SeededRandom): OpportunityCandidate[] {
    return this.eligibleTemplates(s).map((t) => {
      const factors: ScoreFactor[] = sources.map((src) => ({ name: String(src.source), value: Math.exp(sourceDelta(t, src)) }));
      factors.push(...circumstanceFactors(t, s));
      factors.push({ name: "RANDOM", value: rng.range(0.85, 1.15) });
      const probability = clamp(t.baseProbability * factors.reduce((p, f) => p * f.value, 1), 0, MAX_PROBABILITY);
      const opportunity: Opportunity = {
        id: `${t.id}@${s.monthIndex}`,
        templateId: t.id,
        type: t.type,
        title: t.title,
        emoji: t.emoji,
        source: sources.map((x) => x.source).concat("WORLD").join("+"),
        requirements: t.requirements,
        baseProbability: t.baseProbability,
        modifiers: [],
        score: { base: t.baseProbability, factors, probability },
        offeredAt: { ...s.date },
        expiresAt: addMonths(s.date, t.expiresInMonths),
        choices: t.choices,
      };
      let explained = false;
      const explain = () => {
        if (!explained) {
          explained = true;
          sources.forEach((src, i) => {
            const e = explainSource(t, src);
            factors[i].details = e.details;
            opportunity.modifiers.push(...e.modifiers);
          });
        }
        return opportunity;
      };
      return { template: t, opportunity, explain };
    });
  }
}
