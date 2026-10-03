/**
 * What a visit can produce. "NOTHING" is a first-class, common outcome.
 */
import type { GameDate } from "../core/gameDate";
import type { ScoreFactor } from "../sim/opportunity";

export type WorldEventKind =
  | "NOTHING"
  | "CLOSED"
  | "LOCATION_EVENT"
  | "FAMILIAR_FACE"
  | "RECOGNIZED"
  | "CONVERSATION"
  | "NEW_ACQUAINTANCE"
  | "FRIENDSHIP"
  | "INVITATION"
  | "ROMANCE_OPPORTUNITY"
  | "ONLINE_MEETUP"
  | "MEMORY_CALLBACK"
  | "REUNION"
  | "TRAVEL_OPPORTUNITY";

export type WorldEventScale = "NONE" | "SMALL" | "MAJOR";

export interface WorldChoice {
  id: string;
  label: { ko: string; en: string };
}

export interface WorldEvent {
  kind: WorldEventKind;
  scale: WorldEventScale;
  date: GameDate;
  locationId: string;
  npcId?: string;
  text: { ko: string; en: string };
  /** Present when the player must decide (never auto-applied). */
  choices?: WorldChoice[];
  /** Extra data (e.g. destination id for a travel opportunity). */
  payload?: Record<string, string | number | boolean>;
  /** Why this happened (for the debug view). */
  explanation?: { probability: number; factors: ScoreFactor[] };
}

export const MAJOR_KINDS: WorldEventKind[] = ["FRIENDSHIP", "ROMANCE_OPPORTUNITY", "TRAVEL_OPPORTUNITY", "REUNION", "ONLINE_MEETUP", "INVITATION"];
