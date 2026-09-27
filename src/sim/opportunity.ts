/**
 * Opportunity model. Templates live in data/sim/opportunities.json.
 * An Opportunity is an *offer* — it never happens unless a choice is made.
 */
import type { GameDate } from "../core/gameDate";
import type { LifeModifierKey, Modifier } from "../core/lifeModifiers";
import type { EducationLevel, RelationshipStatus } from "./types";

export type OpportunityType =
  | "EDUCATION"
  | "CAREER"
  | "MOBILITY"
  | "WEALTH"
  | "SOCIAL"
  | "ROMANCE"
  | "FAMILY"
  | "CREATIVE"
  | "PERSONAL";

export type Requirement =
  | { kind: "age"; min?: number; max?: number }
  | { kind: "education"; min?: EducationLevel; max?: EducationLevel }
  | { kind: "enrolled"; value: boolean }
  | { kind: "enrolledIn"; program: EducationLevel }
  | { kind: "employed"; value: boolean }
  | { kind: "money"; min: number }
  | { kind: "relationship"; in: RelationshipStatus[] }
  | { kind: "relationshipMonths"; min: number }
  | { kind: "abroad"; value: boolean }
  | { kind: "familySupport"; min: number }
  | { kind: "flag"; name: string; value?: number | boolean | string };

export type Consequence =
  | { kind: "money"; amount: number }
  | { kind: "debt"; amount: number }
  | { kind: "enroll"; program: EducationLevel; months: number; abroad?: boolean }
  | { kind: "moveAbroad" }
  | { kind: "moveHome" }
  | { kind: "moveCity" }
  | { kind: "job"; field?: string; abroad?: boolean }
  | { kind: "careerLevel"; delta: number }
  | { kind: "quitJob" }
  | { kind: "startDating" }
  | { kind: "marry" }
  | { kind: "breakUp"; divorce?: boolean }
  | { kind: "social"; delta: number }
  | { kind: "familyObligation"; delta: number }
  | { kind: "familySupport"; delta: number }
  | { kind: "setFlag"; name: string; value: number | boolean | string }
  | { kind: "gamble"; stake: number; volatilityKey?: LifeModifierKey }
  | { kind: "memory"; text: string; tags?: string[] };

export interface ChoiceAppeal {
  base: number;
  /** Trait weights; applied as w × (trait − 0.5) × 2. */
  traits?: Partial<Record<"riskTolerance" | "novelty" | "sociability" | "ambition", number>>;
  /** Circumstance weights. */
  familyObligation?: number;
  partnered?: number;
  abroad?: number;
  poverty?: number;
}

export interface Choice {
  id: string;
  label: string;
  requirements?: Requirement[];
  /** Optional success roll; failure applies `onFailure`. */
  success?: { base: number; affinity?: Partial<Record<LifeModifierKey, number>> };
  consequences: Consequence[];
  onFailure?: Consequence[];
  appeal: ChoiceAppeal;
}

export interface OpportunityTemplate {
  id: string;
  type: OpportunityType;
  title: string;
  emoji: string;
  /** Per-month base probability of being offered when eligible. */
  baseProbability: number;
  /** How strongly each LifeModifier key drives this opportunity (weights ~0–1). */
  affinity: Partial<Record<LifeModifierKey, number>>;
  requirements: Requirement[];
  /** Soft circumstance shaping (never hard blocks). */
  circumstances?: {
    agePeak?: number;
    ageSpread?: number;
    cost?: number;
    familyObligationPenalty?: number;
    relationship?: Partial<Record<RelationshipStatus, number>>;
    abroad?: number;
    home?: number;
    employed?: number;
    longDistance?: number;
  };
  cooldownMonths: number;
  expiresInMonths: number;
  /** Cap on how many times this can be accepted in one life. */
  maxTimesTaken?: number;
  choices: Choice[];
}

export interface ScoreFactor {
  name: string;
  value: number;
  /** Top contributing modifiers (for "why did this happen?"). */
  details?: Array<{ label: string; value: number }>;
}

export interface OpportunityScore {
  base: number;
  factors: ScoreFactor[];
  probability: number;
  roll?: number;
}

export interface Opportunity {
  id: string;
  templateId: string;
  type: OpportunityType;
  title: string;
  emoji: string;
  /** Which systems shaped it, e.g. "SAJU+WORLD". */
  source: string;
  requirements: Requirement[];
  baseProbability: number;
  /** Modifier contributions (all sources) weighted by this opportunity's affinity. */
  modifiers: Modifier[];
  score: OpportunityScore;
  offeredAt: GameDate;
  expiresAt?: GameDate;
  choices: Choice[];
  relatedCharacters?: string[];
}
