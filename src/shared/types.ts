// Core domain types for Pawprint.
//
// TAB -> ACTIVITY -> PAWPRINT TRAIL -> BROWSING JOURNEY -> POSSIBLE GOAL -> USER CONFIRMATION -> MEMORY

export type InteractionType = "click" | "scroll" | "keyboard";

/** A single meaningful browsing activity (one qualifying page visit). */
export interface Activity {
  id: string;
  url: string;
  domain: string;
  title: string;
  timestamp: number;
  /** Total active (foreground + focused) time on the page, in milliseconds. */
  durationMs: number;
  interactionTypes: InteractionType[];
  favicon?: string;
  /** Journey this activity has been assigned to, if any. */
  journeyId?: string;
  /** User marked this activity as excluded from memory. */
  excluded?: boolean;
}

export type JourneyStatus = "candidate" | "active" | "completed" | "archived";

export type GoalSource = "ai" | "user" | "something_else";

export interface ConfirmedGoal {
  text: string;
  confirmedAt: number;
  source: GoalSource;
}

export interface GoalCandidate {
  id: string;
  text: string;
  /** Short evidence-based explanation, e.g. "Based on pages from ... mentioning ...". */
  rationale: string;
  /** Candidate is broad/ambiguous enough that selecting it should prompt a follow-up question. */
  needsNarrowing?: boolean;
  /** Activity ids that most strongly support this candidate, for narrowing questions. */
  supportingActivityIds: string[];
}

export interface AdaptiveQuestionOption {
  id: string;
  text: string;
  activityIds: string[];
}

export interface AdaptiveQuestion {
  id: string;
  text: string;
  options: AdaptiveQuestionOption[];
  allowFreeText: boolean;
}

export interface Journey {
  id: string;
  title: string;
  status: JourneyStatus;
  activityIds: string[];
  /** Activity ids the user explicitly chose to keep separate (suppresses them from unrelated suggestions). */
  keptSeparateIds: string[];
  goal?: ConfirmedGoal;
  lastAiCandidates?: GoalCandidate[];
  summary?: JourneySummary;
  createdAt: number;
  updatedAt: number;
}

export interface JourneySummary {
  narrative: string;
  explored: string[];
  potentiallyUnrelated: string[];
  generatedAt: number;
}

export interface PrivacySettings {
  trackingPaused: boolean;
  excludedDomains: string[];
  retentionDays: number;
}

export interface PawprintSettings extends PrivacySettings {
  onboardedAt?: number;
}

export const DEFAULT_SETTINGS: PawprintSettings = {
  trackingPaused: false,
  excludedDomains: [],
  retentionDays: 7,
};

/** Minimum active-tab seconds required for an activity to be meaningful. */
export const MEANINGFUL_ACTIVE_SECONDS = 60;

/** Minimum number of related qualifying activities required to form a journey candidate. */
export const MIN_JOURNEY_ACTIVITIES = 3;
