/**
 * EventEngine — decides which scored opportunities actually surface this tick
 * (seeded roll + weighted selection), then resolves the chosen option.
 * It never looks at Saju directly: it only sees Opportunity scores.
 */
import { type LifeModifierKey, type LifeModifiers, clamp } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import { applyConsequences } from "./consequences";
import type { ChoiceOption, DecisionMaker } from "./decisionPolicy";
import type { OpportunityCandidate } from "./opportunityEngine";
import type { Opportunity } from "./opportunity";
import { checkRequirements } from "./requirements";
import type { LifeState } from "./types";

export interface Resolution {
  opportunity: Opportunity;
  choiceId: string;
  choiceLabel: string;
  options: ChoiceOption[];
  success?: boolean;
  successChance?: number;
  changes: string[];
}

export class EventEngine {
  constructor(private readonly maxPerTick = 2) {}

  /** Independent seeded roll per candidate; if too many pass, weighted-sample by score. */
  surface(candidates: OpportunityCandidate[], rng: SeededRandom): Opportunity[] {
    const passed: Opportunity[] = [];
    for (const c of candidates) {
      const roll = rng.next();
      c.opportunity.score.roll = roll;
      if (roll < c.opportunity.score.probability) passed.push(c.explain());
    }
    if (passed.length <= this.maxPerTick) return passed;
    return rng.weightedSample(
      passed.map((o) => ({ item: o, weight: o.score.probability })),
      this.maxPerTick,
    );
  }

  options(state: LifeState, opp: Opportunity): ChoiceOption[] {
    return opp.choices.map((choice) => {
      const r = checkRequirements(state, choice.requirements);
      return { choice, available: r.ok, blockedReason: r.reason };
    });
  }

  /** Apply the decision. `decider` is the player (UI) or an AI policy. */
  resolve(state: LifeState, opp: Opportunity, decider: DecisionMaker, modifiers: LifeModifiers, rng: SeededRandom): Resolution {
    const options = this.options(state, opp);
    let choiceId = decider.choose(state, opp, options, rng);
    let picked = options.find((o) => o.choice.id === choiceId && o.available);
    if (!picked) {
      // A blocked choice can't be taken; fall back to the most passive available option.
      picked = options.find((o) => o.available && o.choice.consequences.length === 0) ?? options.find((o) => o.available)!;
      choiceId = picked.choice.id;
    }
    const choice = picked.choice;
    const changes: string[] = [];
    const ctx = { rng, modifiers, log: changes };

    let success: boolean | undefined;
    let successChance: number | undefined;
    if (choice.success) {
      let delta = 0;
      for (const [k, a] of Object.entries(choice.success.affinity ?? {})) delta += (a as number) * (modifiers[k as LifeModifierKey] ?? 0);
      successChance = clamp(choice.success.base * Math.exp(delta), 0.05, 0.95);
      success = rng.chance(successChance);
    }
    applyConsequences(state, success === false ? choice.onFailure ?? [] : choice.consequences, ctx);

    const h = (state.history[opp.templateId] ??= { offered: [], taken: [] });
    if (choice.consequences.length > 0 && success !== false) h.taken.push(state.monthIndex);

    return { opportunity: opp, choiceId, choiceLabel: choice.label, options, success, successChance, changes };
  }

  markOffered(state: LifeState, opp: Opportunity): void {
    (state.history[opp.templateId] ??= { offered: [], taken: [] }).offered.push(state.monthIndex);
  }
}
