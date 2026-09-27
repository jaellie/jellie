/**
 * Simulation state. Saju (and later Astrology/MBTI) never write to this
 * directly — they only produce modifiers. State changes come exclusively
 * from resolved player/NPC choices and the life tick.
 */
import type { GameDate } from "../core/gameDate";
import type { BirthData } from "../saju/calendar/fourPillars";
import type { SajuChart } from "../saju/chart";
import type { WorldState } from "../world/types";

export const EDUCATION_LEVELS = ["NONE", "HIGH_SCHOOL", "BACHELOR", "MASTER", "PHD"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export const educationRank = (e: EducationLevel) => EDUCATION_LEVELS.indexOf(e);

export type RelationshipStatus = "SINGLE" | "DATING" | "MARRIED" | "DIVORCED";

/** Personality placeholder (0..1). MBTI will later feed these + its own modifier source. */
export interface Traits {
  riskTolerance: number;
  novelty: number;
  sociability: number;
  ambition: number;
  /** Full MBTI-derived persona (planning, emotionalExpression, …) when MBTI is known. */
  persona?: import("../mbti/mbti").Persona;
}

export interface Residence {
  country: string;
  city: string;
}

export interface Enrollment {
  program: EducationLevel;
  untilMonth: number;
  abroad: boolean;
}

export interface Memory {
  date: GameDate;
  age: number;
  text: string;
  tags: string[];
}

/** Shared by the player and NPCs. */
export interface Character {
  id: string;
  name: string;
  birth: BirthData;
  /** Natal chart — computed once at creation. */
  chart: SajuChart;
}

export interface Npc extends Character {
  role: "PARTNER" | "EX" | "FRIEND" | "MENTOR" | "ACQUAINTANCE";
  metAt: GameDate;
}

export interface LifeState extends Character {
  date: GameDate;
  /** Months since birth (the simulation's monotonic clock). */
  monthIndex: number;
  age: number;
  alive: boolean;

  traits: Traits;
  /** Money in thousands. Can go negative (debt). */
  money: number;
  debt: number;
  /** 0..1 how much the family can help financially. */
  familySupport: number;
  /** 0..1 caretaking/financial responsibilities toward family. */
  familyObligation: number;

  education: EducationLevel;
  enrollment?: Enrollment;
  career: { employed: boolean; field?: string; level: number; abroad: boolean };

  homeCountry: string;
  location: Residence;

  relationship: { status: RelationshipStatus; partnerId?: string; sinceMonth?: number; longDistance?: boolean };
  socialCircle: number;
  npcs: Npc[];

  memories: Memory[];
  /** Opportunity history: template id → month indexes it was offered / taken. */
  history: Record<string, { offered: number[]; taken: number[] }>;
  flags: Record<string, number | boolean | string>;
  /** Living world (locations, NPCs, encounters, memories). Present when the world layer is enabled. */
  world?: WorldState;
}

export function isAbroad(s: LifeState): boolean {
  return s.location.country !== s.homeCountry;
}
