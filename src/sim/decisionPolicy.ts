/**
 * Who decides. In the real game a UI implements DecisionMaker; the simulation
 * runner uses AutoDecisionPolicy. Saju is NOT an input here — choices come
 * from personality and circumstances, so destiny can always be refused.
 */
import type { SeededRandom } from "../core/rng";
import type { Choice, Opportunity } from "./opportunity";
import { type LifeState, isAbroad } from "./types";

export interface ChoiceOption {
  choice: Choice;
  available: boolean;
  blockedReason?: string;
}

export interface DecisionMaker {
  choose(state: LifeState, opportunity: Opportunity, options: ChoiceOption[], rng: SeededRandom): string;
}

export function choiceUtility(s: LifeState, choice: Choice): number {
  const a = choice.appeal;
  let u = a.base;
  for (const [trait, w] of Object.entries(a.traits ?? {})) u += (w as number) * (s.traits[trait as keyof typeof s.traits] - 0.5) * 2;
  if (a.familyObligation) u += a.familyObligation * s.familyObligation;
  if (a.partnered && s.relationship.status !== "SINGLE" && s.relationship.status !== "DIVORCED") u += a.partnered;
  if (a.abroad && isAbroad(s)) u += a.abroad;
  if (a.poverty) u += a.poverty * Math.max(0, Math.min(1, (10 - s.money) / 20));
  return u;
}

export class AutoDecisionPolicy implements DecisionMaker {
  constructor(private readonly noise = 0.25) {}

  choose(state: LifeState, _opp: Opportunity, options: ChoiceOption[], rng: SeededRandom): string {
    const available = options.filter((o) => o.available);
    if (available.length === 0) return options.at(-1)!.choice.id;
    let best = available[0];
    let bestU = -Infinity;
    for (const o of available) {
      const u = choiceUtility(state, o.choice) + rng.range(-this.noise, this.noise);
      if (u > bestU) (bestU = u), (best = o);
    }
    return best.choice.id;
  }
}

/** Always refuses — used in tests to prove destiny never forces outcomes. */
export class RefuseEverythingPolicy implements DecisionMaker {
  choose(_s: LifeState, _o: Opportunity, options: ChoiceOption[]): string {
    const passive = options.find((o) => o.available && o.choice.consequences.length === 0);
    return (passive ?? options.at(-1)!).choice.id;
  }
}
