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
import { SajuModifierEngine, type SajuModifierResult } from "../saju/interpretation/sajuModifierEngine";
import { AutoDecisionPolicy, type DecisionMaker } from "./decisionPolicy";
import { EventEngine, type Resolution } from "./eventEngine";
import { lifeTick } from "./lifeTick";
import { OpportunityEngine } from "./opportunityEngine";
import type { OpportunityScore } from "./opportunity";
import { traitsToModifierSource } from "./personality";
import type { LifeState, Traits } from "./types";

export interface LifeProfile {
  name?: string;
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
  kind: "OPPORTUNITY" | "LIFE";
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
  /** Scale Saju influence (0 disables it; handy for A/B balancing). */
  sajuWeight?: number;
  opportunityEngine?: OpportunityEngine;
  onTick?: (s: LifeState, saju: SajuModifierResult) => void;
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
    traits: { riskTolerance: 0.5, novelty: 0.5, sociability: 0.5, ambition: 0.5, ...profile.traits },
    money: profile.money ?? 5,
    debt: 0,
    familySupport: profile.familySupport ?? 0.4,
    familyObligation: profile.familyObligation ?? 0.2,
    education: "NONE",
    career: { employed: false, level: 0, abroad: false },
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

export function simulateLife(opts: SimulateLifeOptions): SimulationResult {
  const rng = new SeededRandom(opts.seed);
  const oppRng = rng.fork("opportunity");
  const eventRng = rng.fork("event");
  const worldRng = rng.fork("world");
  const saju = new SajuModifierEngine();
  const oppEngine = opts.opportunityEngine ?? new OpportunityEngine();
  const eventEngine = new EventEngine();
  const decider = opts.decisionMaker ?? new AutoDecisionPolicy();

  const state = createLifeState(opts.birthData, opts.profile);
  const timeline: TimelineEntry[] = [];
  const totalMonths = Math.round(opts.duration * 12);

  while (state.monthIndex < totalMonths) {
    for (const note of lifeTick(state)) timeline.push({ date: { ...state.date }, age: state.age, kind: "LIFE", title: note });
    if (state.age < OPPORTUNITY_START_AGE) continue;

    const sajuResult = saju.calculateDetailed(state.chart, state.date);
    const sources: DestinyModifierSource[] = [
      saju.toModifierSource(sajuResult, opts.sajuWeight ?? 1),
      traitsToModifierSource(state.traits),
      ...(opts.extraSources ?? []).map((f) => f(state)),
    ];
    opts.onTick?.(state, sajuResult);
    const combined = mergeModifierSources(sources);

    const candidates = oppEngine.evaluate(state, sources, oppRng);
    for (const opp of eventEngine.surface(candidates, eventRng)) {
      eventEngine.markOffered(state, opp);
      const r: Resolution = eventEngine.resolve(state, opp, decider, combined, worldRng);
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
  }
  return { seed: opts.seed, timeline, finalState: state };
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
    lines.push(`${age} ${formatGameDate(e.date)}  ${e.emoji} ${e.title} → ${e.choice}${outcome}${changes}`);
  }
  return lines.join("\n");
}
