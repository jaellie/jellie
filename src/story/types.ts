/**
 * Story layer: the destiny script (5–7 fated turning points computed from
 * 사주 + 점성술 at birth) and multi-day arcs (engagement → 상견례 → wedding,
 * divorce → court, pregnancy → birth, adopting a pet, retirement…).
 *
 * The *situation* of a fated event is certain; its *outcome* is decided
 * 70% by the chart and 30% by the player's choice (see resolveOutcome).
 */
export type FatedTheme =
  | "LOVE_MEETING"
  | "MARRIAGE"
  | "RELATIONSHIP_CRISIS"
  | "CAREER_TURN"
  | "MOVE"
  | "FAMILY_LOSS"
  | "WEALTH"
  | "CHILD"
  | "PET"
  | "EARLY_RETIREMENT"
  | "ILLNESS";

export interface FatedEvent {
  id: string;
  theme: FatedTheme;
  /** Age (years) and target month index when it happens. */
  age: number;
  monthIndex: number;
  /** Chart's outcome preference (sums to 1) — the 70% part. */
  chartWeights: Record<string, number>;
  /** Why the chart put it here (debug only; never shown to players). */
  signals: string[];
  done?: boolean;
  hinted?: boolean;
  outcome?: string;
  /** Runtime data (e.g. who is ill). */
  data?: Record<string, string | number | boolean>;
}

export type ArcType =
  | "DATING"
  | "ENGAGEMENT"
  | "DIVORCE"
  | "PREGNANCY"
  | "RETIREMENT"
  | "PARENT_PASSING"
  | "PET_FAREWELL"
  | "ILLNESS"
  /** The partner's sudden accident / collapse / old age: the call → the funeral. */
  | "PARTNER_PASSING"
  | "PARTING"
  /** Finding out the partner is cheating. */
  | "AFFAIR"
  /** A grandparent, aunt/uncle or sibling passes away. */
  | "FAMILY_PASSING"
  /** Dating the destined person who lives in another city or country: calls, a visit, who moves. */
  | "LONG_DISTANCE"
  /** 썸: already talking with the destined person — the texts, the not-a-date, the confession. */
  | "TALKING";

export interface ArcStep {
  key: string;
  dueMonth: number;
}

export interface ActiveArc {
  id: string;
  type: ArcType;
  steps: ArcStep[];
  step: number;
  /** Extra data (partner id, pet id, which parent…). */
  data?: Record<string, string | number | boolean>;
}

export interface StoryState {
  script: FatedEvent[];
  arcs: ActiveArc[];
  /** Month index of the next scheduled played day and why. */
  nextDay?: { month: number; kind: "calm" | "fated" | "foreshadow" | "arc"; ref?: string; second?: { kind: "fated" | "arc"; ref: string } };
  log: Array<{ age: number; ko: string; en: string }>;
  nextArcId: number;
  /** Memory cards waiting for the next 시간이 흐른다 screen. */
  cards: Array<{ kind: string; age: number; vars: Record<string, string> }>;
  /** The destined person's life from setup: where they live, their job (see fatedProfile.ts). */
  fatedLife?: import("./fatedProfile").FatedLife;
  /** How the first confession is written in the charts (see confessFate.ts). */
  confessFate?: import("./confessFate").ConfessFate;
  /** The best years for the two of you to meet (both charts), best first — for second chances. */
  loveYears?: Array<{ age: number; score: number; tags: string[] }>;
  /** Hidden 궁합 with the destined person from setup (0..1 score + flavour). */
  compat?: { score: number; chemistry: number; stability: number; friction: number };
  /** The player's birthplace (for 궁합 synastry with partners met along the way). */
  place?: { lat: number; lon: number; name?: string; tz?: string };
  /** 궁합 with the current partner when they aren't the destined person (computed once per partner). */
  partnerCompat?: { id: string; score: number };
  /** Life events (library): queue, history, rate limit. */
  events?: import("./lifeEvents").LifeEventState;
  /** The bond with the destined person: when it began, how it ended (frames the whole game). */
  bond?: import("./bond").Bond;
  /** Destined person left entirely to fate: who the chart says they are (lifelong spouse or last love), and why. */
  fateMode?: import("./marriageFate").FateMode;
  /** Little celebrations waiting for their day: 100일, anniversaries, birthdays (see occasions.json). */
  occasions?: Array<{ kind: "anniv100" | "datingAnniv" | "weddingAnniv" | "myBirthday" | "partnerBirthday"; month: number; n?: number; /** Worth a day of its own (100일, the first anniversary, round wedding years); the rest ride along on a nearby day. */ big?: boolean }>;
  /** When each kind of occasion last came (month index) — birthdays aren't every year. */
  occasionLast?: Record<string, number>;
  fateSigns?: string[];
}
