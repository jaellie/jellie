/**
 * Seeded full-life simulation runner.
 *
 *   Birth chart ─► SajuModifierEngine ─┐
 *   Personality (MBTI later) ──────────┼─► OpportunityEngine ─► EventEngine ─► DecisionMaker ─► consequences ─► memory
 *   Astrology (later) ─────────────────┘                ▲
 *                              world circumstances ─────┘
 *
 * Same seed ⇒ identical life. Different seed ⇒ different life.
 */
import type { DestinyModifierSource } from "../core/lifeModifiers";
import { mergeModifierSources } from "../core/lifeModifiers";
import { SeededRandom } from "../core/rng";
import { formatGameDate, type GameDate } from "../core/gameDate";
import type { BirthData } from "../saju/calendar/fourPillars";
import { calculateNatalChart } from "../saju/chart";
import { AutoDecisionPolicy, type DecisionMaker } from "./decisionPolicy";
import { EventEngine, type Resolution } from "./eventEngine";
import { lifeTick } from "./lifeTick";
import { DEFAULT_TEMPLATES, OpportunityEngine } from "./opportunityEngine";
import type { OpportunityScore } from "./opportunity";
import { traitsToModifierSource } from "./personality";
import type { LifeState, Traits } from "./types";
import { createWorldState } from "../world/npcs";
import { runMonth } from "../world/routine";
import { AutoWorldPolicy, type WorldDecisionPolicy } from "../world/decisions";
import { worldModifierSource } from "../world/worldModifiers";
import type { Attraction } from "../world/encounters";
import { createDestinyProfile, type DestinyProfile } from "../destiny/profile";
import type { BirthPlace } from "../astrology/chart";
import { parseMbti, personaFromMbti, traitsFromPersona } from "../mbti/mbti";
import { getLocation } from "../world/catalog";

export interface LifeProfile {
  name?: string;
  /** e.g. "ENFP" or "INTJ-T". Drives personality (decisions) and an MBTI modifier source. */
  mbti?: string;
  /** Birthplace for the astrology chart's houses (default Seoul). */
  birthPlace?: BirthPlace;
  traits?: Partial<Traits>;
  money?: number;
  familySupport?: number;
  familyObligation?: number;
  homeCountry?: string;
  city?: string;
}

export interface TimelineEntry {
  date: GameDate;
  age: number;
  kind: "OPPORTUNITY" | "LIFE" | "WORLD";
  /** WORLD entries: where it happened and what kind of world event it was. */
  locationId?: string;
  worldEvent?: string;
  title: string;
  emoji?: string;
  templateId?: string;
  choiceId?: string;
  choice?: string;
  blocked?: Array<{ label: string; reason?: string }>;
  success?: boolean;
  successChance?: number;
  changes?: string[];
  score?: OpportunityScore;
}

export interface SimulateLifeOptions {
  seed: number;
  birthData: BirthData;
  /** Years to simulate. */
  duration: number;
  profile?: LifeProfile;
  decisionMaker?: DecisionMaker;
  /** Extra destiny sources (Astrology, MBTI) as functions of state. */
  extraSources?: Array<(s: LifeState) => DestinyModifierSource>;
  /** Scale each destiny system (0 disables it; handy for A/B balancing). */
  sajuWeight?: number;
  astrologyWeight?: number;
  mbtiWeight?: number;
  opportunityEngine?: OpportunityEngine;
  onTick?: (s: LifeState, sources: DestinyModifierSource[]) => void;
  /** Enable the living world (locations, NPCs, encounters, travel). */
  world?: boolean | WorldOptions;
  /** Parents and the player can die (the game uses this; off by default for fixed-length runs). */
  mortality?: boolean;
  /** Game mode: big life events are story-driven, so the background sim must not do them silently. */
  excludeTemplates?: string[];
  parentMortality?: boolean;
  autoRetire?: boolean;
}

export interface WorldOptions {
  attraction?: Attraction;
  policy?: WorldDecisionPolicy;
  maxHabitVisits?: number;
  /** Also log SMALL world events (default: MAJOR only). */
  logSmall?: boolean;
}

export interface SimulationResult {
  seed: number;
  timeline: TimelineEntry[];
  finalState: LifeState;
}

export function createLifeState(birth: BirthData, profile: LifeProfile = {}): LifeState {
  const chart = calculateNatalChart(birth);
  const home = profile.homeCountry ?? "Korea";
  return {
    id: "player",
    name: profile.name ?? "Player",
    birth,
    chart,
    date: { year: birth.year, month: birth.month },
    monthIndex: 0,
    age: 0,
    alive: true,
    traits: {
      ...(profile.mbti ? traitsFromPersona(personaFromMbti(parseMbti(profile.mbti), hashName(profile.name ?? "Player"))) : { riskTolerance: 0.5, novelty: 0.5, sociability: 0.5, ambition: 0.5 }),
      ...profile.traits,
    },
    money: profile.money ?? 5,
    debt: 0,
    familySupport: profile.familySupport ?? 0.4,
    familyObligation: profile.familyObligation ?? 0.2,
    education: "NONE",
    career: { employed: false, level: 0, abroad: false, cid: 0 },
    family: { mom: { alive: true, birthYear: birth.year - 29 }, dad: { alive: true, birthYear: birth.year - 31 } },
    homeCountry: home,
    location: { country: home, city: profile.city ?? "Seoul" },
    relationship: { status: "SINGLE" },
    socialCircle: 3,
    npcs: [],
    memories: [],
    history: {},
    flags: {},
  };
}

const OPPORTUNITY_START_AGE = 12;

function hashName(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/**
 * Steps one life month by month. Shared by simulateLife (whole lives) and the
 * game runtime (the months between played days).
 */
export class LifeRunner {
  readonly state: LifeState;
  readonly destiny: DestinyProfile;
  private readonly oppRng: SeededRandom;
  private readonly eventRng: SeededRandom;
  private readonly worldRng: SeededRandom;
  private readonly worldRngMonthly: SeededRandom;
  private readonly mortalityRng: SeededRandom;
  private readonly oppEngine: OpportunityEngine;
  private readonly eventEngine = new EventEngine();
  private readonly decider: DecisionMaker;
  private readonly worldOpts?: WorldOptions;
  private readonly worldPolicy: WorldDecisionPolicy;

  constructor(private readonly opts: SimulateLifeOptions, state?: LifeState) {
    const rng = new SeededRandom(opts.seed);
    this.oppRng = rng.fork("opportunity");
    this.eventRng = rng.fork("event");
    this.worldRng = rng.fork("world");
    this.worldRngMonthly = rng.fork("living-world");
    this.mortalityRng = rng.fork("mortality");
    this.oppEngine = opts.opportunityEngine ?? new OpportunityEngine(opts.excludeTemplates ? DEFAULT_TEMPLATES.filter((t) => !opts.excludeTemplates!.includes(t.id)) : undefined);
    this.decider = opts.decisionMaker ?? new AutoDecisionPolicy();
    this.state = state ?? createLifeState(opts.birthData, opts.profile);
    this.destiny = createDestinyProfile({
      birth: opts.birthData,
      place: opts.profile?.birthPlace,
      mbti: opts.profile?.mbti,
      seed: hashName(opts.profile?.name ?? "Player"),
      weights: { SAJU: opts.sajuWeight ?? 1, ASTROLOGY: opts.astrologyWeight ?? 1, MBTI: opts.mbtiWeight ?? 1 },
    });
    this.worldOpts = opts.world ? (opts.world === true ? {} : opts.world) : undefined;
    this.worldPolicy = this.worldOpts?.policy ?? new AutoWorldPolicy();
    if (this.worldOpts && !this.state.world) this.state.world = createWorldState();
  }

  /** All destiny/world sources for the current month. */
  sources(): DestinyModifierSource[] {
    const state = this.state;
    return [
      ...this.destiny.sourcesAt(state.date),
      // Without MBTI, fall back to the generic trait source.
      ...(this.destiny.mbti ? [] : [traitsToModifierSource(state.traits)]),
      ...(state.world ? [worldModifierSource(state.world)] : []),
      ...(this.opts.extraSources ?? []).map((f) => f(state)),
    ];
  }

  modifiers() {
    return mergeModifierSources(this.sources());
  }

  /** Advance one month; returns what happened. */
  stepMonth(): TimelineEntry[] {
    const { state, opts } = this;
    const timeline: TimelineEntry[] = [];
    for (const note of lifeTick(state, opts.mortality ? this.mortalityRng : undefined, { parents: opts.parentMortality ?? true, autoRetire: opts.autoRetire ?? true })) timeline.push({ date: { ...state.date }, age: state.age, kind: "LIFE", title: note });
    if (state.age < OPPORTUNITY_START_AGE || !state.alive) return timeline;

    const sources = this.sources();
    opts.onTick?.(state, sources);
    const combined = mergeModifierSources(sources);

    const candidates = this.oppEngine.evaluate(state, sources, this.oppRng);
    for (const opp of this.eventEngine.surface(candidates, this.eventRng)) {
      this.eventEngine.markOffered(state, opp);
      const r: Resolution = this.eventEngine.resolve(state, opp, this.decider, combined, this.worldRng);
      timeline.push({
        date: { ...state.date },
        age: state.age,
        kind: "OPPORTUNITY",
        title: opp.title,
        emoji: opp.emoji,
        templateId: opp.templateId,
        choiceId: r.choiceId,
        choice: r.choiceLabel,
        blocked: r.options.filter((o) => !o.available).map((o) => ({ label: o.choice.label, reason: o.blockedReason })),
        success: r.success,
        successChance: r.successChance,
        changes: r.changes,
        score: opp.score,
      });
    }
    const worldOpts = this.worldOpts;
    if (state.world && worldOpts && state.age >= 14) {
      const month = runMonth(
        { state, world: state.world, modifiers: combined, rng: this.worldRngMonthly, seed: opts.seed, policy: this.worldPolicy, attraction: worldOpts.attraction, maxHabitVisits: worldOpts.maxHabitVisits },
        state.date,
      );
      const decided = new Map(month.decisions.map((d) => [d.event, d.resolution]));
      const allVisits = [...month.visits, ...month.trips.flatMap((t) => t.visits)];
      for (const v of allVisits) {
        for (const e of v.events) {
          if (e.scale === "NONE" || (e.scale === "SMALL" && !worldOpts.logSmall)) continue;
          const r = decided.get(e);
          const npc = e.npcId ? state.world.npcs[e.npcId] : undefined;
          timeline.push({
            date: { year: e.date.year, month: e.date.month, day: e.date.day },
            age: state.age,
            kind: "WORLD",
            title: `${getLocation(e.locationId).name.en}: ${e.text.en}`,
            locationId: e.locationId,
            worldEvent: e.kind,
            choice: r?.choiceId,
            success: r?.success,
            changes: r?.changes,
            templateId: npc?.type,
          });
        }
      }
      for (const t of month.trips) {
        timeline.push({
          date: { ...t.trip.arrivalDate },
          age: state.age,
          kind: "WORLD",
          title: `✈️ Trip to ${t.trip.destinationId}: visited ${t.trip.visitedLocations.length} places, mementos: ${t.trip.mementos.join(", ") || "none"}`,
          worldEvent: "TRIP",
          changes: t.keptContacts.map((id) => `kept in touch with ${state.world!.npcs[id]?.name}`),
        });
      }
    }
    return timeline;
  }
}

export function simulateLife(opts: SimulateLifeOptions): SimulationResult {
  const runner = new LifeRunner(opts);
  const timeline: TimelineEntry[] = [];
  const totalMonths = Math.round(opts.duration * 12);
  while (runner.state.monthIndex < totalMonths && runner.state.alive) timeline.push(...runner.stepMonth());
  return { seed: opts.seed, timeline, finalState: runner.state };
}

export function formatTimeline(result: SimulationResult, opts: { onlyOpportunities?: boolean } = {}): string {
  const lines: string[] = [];
  for (const e of result.timeline) {
    if (opts.onlyOpportunities && e.kind !== "OPPORTUNITY") continue;
    const age = `Age ${Math.floor(e.age)}`.padEnd(7);
    if (e.kind === "LIFE") {
      lines.push(`${age} ${formatGameDate(e.date)}  · ${e.title}`);
      continue;
    }
    const outcome = e.success === undefined ? "" : e.success ? " ✔" : " ✘";
    const changes = e.changes?.length ? `  [${e.changes.join("; ")}]` : "";
    if (e.kind === "WORLD") {
      lines.push(`${age} ${formatGameDate(e.date)}  · ${e.title}${e.choice ? ` → ${e.choice}${outcome}` : ""}${changes}`);
      continue;
    }
    lines.push(`${age} ${formatGameDate(e.date)}  ${e.emoji} ${e.title} → ${e.choice}${outcome}${changes}`);
  }
  return lines.join("\n");
}
