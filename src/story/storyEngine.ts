/**
 * Story engine: turns the destiny script + multi-day arcs into played days,
 * popups, outcomes, scene changes and memory cards.
 *
 *  - The day scheduler places a played day on every fated event (plus a
 *    foreshadowing day before it) and on every arc step (상견례, 결혼식,
 *    법원, 출산, 송별회, 장례식…). Calm days fill gaps (never > ~2 years).
 *  - Fated outcomes = 70% chart + 30% player's strategy (resolveOutcome).
 *  - Nothing big happens silently between days: those are all on-screen.
 *    Only small background life (friends' weddings/funerals, kids growing,
 *    pets aging) happens off-screen — and even those leave a memory card.
 */
import { bondPhase, pendingMeetings } from "./bond";
import { cultureOf, nameKo, petName, pickName } from "../world/names";
import fatedData from "../../data/story/fatedEvents.json";
import arcData from "../../data/story/arcs.json";
import seqData from "../../data/story/sequences.json";
import { SeededRandom } from "../core/rng";
import type { LifeModifiers } from "../core/lifeModifiers";
import { calculateNatalChart } from "../saju/chart";
import type { BirthData } from "../saju/calendar/fourPillars";
import { type BirthPlace, DEFAULT_BIRTHPLACE, calculateAstrologyChart } from "../astrology/chart";
import { applyConsequences } from "../sim/consequences";
import type { Consequence } from "../sim/opportunity";
import type { LifeState } from "../sim/types";
import { annualMortality } from "../sim/lifeTick";
import { generateNpc, npcAge } from "../world/npcs";
import type { WorldNpc } from "../world/types";
import { type LifeFacts, computeFacts, meets } from "../game/facts";
import { SPEAKER_REQUIRES } from "../game/director";
import { fillNames } from "../game/text";
import { compatFactor } from "../destiny/compatibility";
import { AUNTS_UNCLES, GRANDPARENT_WORD, aliveSiblings, siblingLabel } from "./family";
import { fireHooks, lifeEvent, pendingApplies, queueChain } from "./lifeEvents";
import { buildDestinyScript, loveYears, resolveOutcome } from "./destinyScript";
import type { ActiveArc, ArcType, FatedEvent, FatedTheme, StoryState } from "./types";
import { meetPlan } from "./fatedProfile";

type Bi = { ko: string; en: string };
type StoryEffect = Consequence | { kind: string; [k: string]: unknown };

interface FatedVariant {
  requires: string[];
  /** When several variants apply, the highest priority wins; ties are picked at random (stable per event). */
  priority?: number;
  location: string;
  activity?: string;
  who: string;
  /** The destined person is in the scene even though someone else speaks (e.g. confessing to a crush). */
  withFated?: boolean;
  /** Overrides the theme's big-popup title. */
  title?: Bi;
  /** The first meeting with the destined person: where and how comes from their life (fatedProfile.ts). */
  meet?: boolean;
  line: Bi;
  choices: Array<{ t: Bi; weights: Record<string, number> }>;
  /** 궁합 bends these outcomes when the destined person is involved: +1 grows with good 궁합, −1 shrinks. */
  compat?: Record<string, number>;
  outcomes: Record<string, { r: Bi; effects: StoryEffect[]; card?: string; scene?: string[]; who?: string }>;
}
interface ArcStepDef {
  /** Big-popup title (결혼식, 상견례…). */
  title?: Bi;
  after: [number, number];
  location: string;
  activity?: string;
  who: string;
  line: Bi;
  /**
   * Alternative speaker + line. altBy "cause": picked by arc.data.cause (accident / sudden / old).
   * altBy "speaker": the first entry whose speaker can still speak (mom → dad → me); arc.data.kind
   * ("sibling") selects its own entry first.
   */
  alt?: Record<string, { who: string; line: Bi; location?: string }>;
  /** The destined person is in the scene though you speak (the confession). */
  withFated?: boolean;
  /**
   * The same step shaped by both personalities: `me` / `them` = MBTI letters that must all match
   * (e.g. me "E", them "I"; them "JF"). The best match (most letters) wins. A variant may bring its
   * own speaker, line, choices and result lines (outcomes: { KEY: { r } }).
   */
  byMbti?: Array<{ me?: string; them?: string; who?: string; line: Bi; location?: string; choices?: ArcStepDef["choices"]; outcomes?: Record<string, { r: Bi; who?: string }> }>;
  /** "distance": by where the destined partner lives (city / abroad). */
  altBy?: "cause" | "speaker" | "distance" | "parent";
  /** A fixed outcome, or a roll (bent by 궁합 when the partner is the destined person). */
  choices: Array<{ t: Bi; outcome?: string; roll?: Record<string, number>; compat?: Record<string, number> }>;
  outcomes: Record<string, { r: Bi; effects: StoryEffect[]; card?: string; scene?: string[]; who?: string }>;
}

const THEMES = fatedData.themes as unknown as Record<FatedTheme, { hint: Bi; title?: Bi; variants: FatedVariant[] }>;
const ARCS = arcData.arcs as unknown as Record<ArcType, { steps: Record<string, ArcStepDef> }>;
const ARC_ORDER: Record<ArcType, string[]> = {
  DATING: ["FIRST_DATE", "FIRST_KISS", "FIRST_FIGHT", "MEET_FRIENDS", "PROPOSAL", "LAST_CHANCE"],
  ENGAGEMENT: ["MEET_PARENTS", "WEDDING"],
  DIVORCE: ["COURT"],
  PREGNANCY: ["CHECKUP", "BIRTH"],
  RETIREMENT: ["FAREWELL"],
  PARENT_PASSING: ["LAST_WORDS", "FUNERAL", "AFTER"],
  PET_FAREWELL: ["GOODBYE"],
  ILLNESS: ["TREATMENT", "RESULT"],
  PARTNER_PASSING: ["CALL", "FAREWELL"],
  AFFAIR: ["DISCOVER"],
  FAMILY_PASSING: ["GOODBYE"],
  LONG_DISTANCE: ["CALL", "VISIT", "DECIDE"],
  TALKING: ["TEXTS", "NOT_A_DATE", "JEALOUS", "CONFESS"],
};
const IN_PERSON = ["FIRST_DATE", "FIRST_KISS", "FIRST_FIGHT", "MEET_FRIENDS"];
const COUNTRY_NAME: Record<string, string> = { JP: "Japan", US: "USA", CA: "Canada", DE: "Germany", AU: "Australia", GB: "UK", SG: "Singapore", FR: "France" };
/** The sex the player is drawn to (for someone new to date). */
function likedSex(state: LifeState, rng: SeededRandom): "MALE" | "FEMALE" {
  const likes = String(state.flags.likes ?? (state.birth.sex === "FEMALE" ? "M" : "F"));
  return likes === "A" ? (rng.chance(0.5) ? "MALE" : "FEMALE") : likes === "M" ? "MALE" : "FEMALE";
}
/** Names that fit where you live now (kids born in Tokyo may get Japanese names). Korean at home. */
function localCulture(state: LifeState): string {
  return cultureOf(state.location.country);
}
export const RETIRE_AGE = 60;
const FRIEND_CARD_CAP = 2;
const FRIEND_CARD_GAP = 60;

/** Background templates the game never lets happen silently off-screen. */
export const STORY_ONLY_TEMPLATES = [
  "PROPOSAL", "RELATIONSHIP_STRAIN", "ROMANTIC_ENCOUNTER", "LAYOFF", "INTERNATIONAL_JOB", "DOMESTIC_RELOCATION",
  "FAMILY_NEED", "BUSINESS_OPPORTUNITY", "RETURN_HOME", "CAREER_CHANGE", "EXCHANGE_SEMESTER", "STUDY_ABROAD_GRAD",
];

export interface StoryCtx {
  state: LifeState;
  seed: number;
  rng: SeededRandom;
  mods: LifeModifiers;
  facts: LifeFacts;
  /** This year's 사주/점성술 signals (도화, 편재, 삼재, SR contacts…) — life events lean on them. */
  signals?: Record<string, number>;
}

export interface StoryPopupDef {
  ref: string;
  who: string;
  line: Bi;
  choices: Bi[];
  location: string;
  activity?: string;
  needsFated?: boolean;
  /** The partner is in the scene (a date, the proposal). */
  needsPartner?: boolean;
  /** Extra placeholders for the text ({relative}, {patient}…). */
  vars?: Record<string, string>;
  /** Short title for the big popup (결혼식, 장례식, 프러포즈…). */
  title?: Bi;
}

// ---------------------------------------------------------------------------
// Setup & scheduling
// ---------------------------------------------------------------------------

export function initStory(state: LifeState, birth: BirthData, place: BirthPlace | undefined, seed: number, fated?: { birth: BirthData; place: BirthPlace }): StoryState {
  const saju = state.chart ?? calculateNatalChart(birth);
  const astro = calculateAstrologyChart(birth, place ?? DEFAULT_BIRTHPLACE);
  const partner = fated ? { saju: calculateNatalChart(fated.birth), astro: calculateAstrologyChart(fated.birth, fated.place), birthYear: fated.birth.year } : undefined;
  const start = Math.floor(state.age);
  const script = buildDestinyScript(saju, astro, { birthYear: birth.year, seed, startAge: start, partner });
  state.story = { script, arcs: [], log: [], nextArcId: 1, cards: [], place: place ?? DEFAULT_BIRTHPLACE };
  if (partner) state.story.loveYears = loveYears(saju, astro, birth.year, partner, start + 1, start + 25).slice(0, 12);
  return state.story;
}

/** Calm days only when nothing big happens for a long while (keeps a life ≈ 18–22 played days). */
function maxGapMonths(age: number): number {
  // Young years are where the love story happens: never years without a played day.
  return age < 32 ? 30 : age < 40 ? 44 : age < 60 ? 84 : 124;
}

/** Fated events coming soon that deserve a hint today (shown on whatever day comes before them). */
export function upcomingHint(state: LifeState): FatedEvent | undefined {
  return state.story?.script.find((e) => !e.done && !e.hinted && e.monthIndex - state.monthIndex > 0 && e.monthIndex - state.monthIndex <= 18);
}

/** Decide when the next played day is (month index) and why. */
export function scheduleNext(state: LifeState, rng: SeededRandom): NonNullable<StoryState["nextDay"]> {
  const st = state.story!;
  const now = state.monthIndex;
  const cands: Array<{ month: number; kind: "calm" | "fated" | "foreshadow" | "arc"; ref?: string; prio: number }> = [];
  // Before you meet the destined person, the years pass off-screen: the next played day is the meeting.
  const meeting = bondPhase(state) === "waiting" ? pendingMeetings(state)[0] : undefined;
  if (meeting) {
    st.nextDay = { month: Math.max(now + 1, meeting.monthIndex), kind: "fated", ref: meeting.id };
    return st.nextDay;
  }
  for (const e of st.script) {
    if (e.done) continue;
    cands.push({ month: Math.max(now + 1, e.monthIndex), kind: "fated", ref: e.id, prio: 3 });
  }
  for (const a of st.arcs) {
    const step = a.steps[a.step];
    // An in-person step waits while you live apart — it doesn't bring a day of its own.
    if (step && a.type === "DATING" && state.relationship.longDistance && IN_PERSON.includes(step.key)) continue;
    if (step) cands.push({ month: Math.max(now + 1, step.dueMonth), kind: "arc", ref: a.id, prio: 2 });
  }
  cands.push({ month: now + Math.max(2, Math.round(maxGapMonths(state.age) * rng.range(0.75, 1))), kind: "calm", prio: 0 });
  // An urgent follow-up (the loan shark at the door) or a life-changing event (coming out, a jackpot) brings a day.
  const wanted = eventDayWanted(state);
  if (wanted !== undefined) cands.push({ month: Math.max(now + 1, wanted), kind: "calm", prio: 1 });
  cands.sort((a, b) => a.month - b.month || b.prio - a.prio);
  const next: NonNullable<StoryState["nextDay"]> = { month: Math.max(now + 1, cands[0].month), kind: cands[0].kind, ref: cands[0].ref };
  // Two lighter moments due in the same season share one day (morning + afternoon) — keeps a life ≈ 20 days.
  // Grave moments (funerals, illness, betrayal, divorce…) always get a day of their own.
  // A big moment in four parts (confession, first kiss, proposal) gets its day to itself, too.
  const bigMoment = (kind: string, ref: string) => kind === "arc" && (() => {
    const a = st.arcs.find((x) => x.id === ref);
    return !!a && !!SEQS[a.steps[a.step]?.key ?? ""];
  })();
  if ((next.kind === "fated" || next.kind === "arc") && !isGrave(state, next.kind, next.ref!) && !bigMoment(next.kind, next.ref!)) {
    const firstArc = next.kind === "arc" ? next.ref : undefined;
    const pair = cands.slice(1).find((c) => (c.kind === "fated" || c.kind === "arc") && c.ref !== next.ref && c.ref !== firstArc && c.month <= next.month + SHARED_DAY_MONTHS && !isGrave(state, c.kind, c.ref!) && !bigMoment(c.kind, c.ref!));
    if (pair) next.second = { kind: pair.kind as "fated" | "arc", ref: pair.ref! };
  }
  st.nextDay = next;
  return next;
}

/**
 * When the pending life events want a played day: an urgent follow-up (the loan shark at the door, the
 * fraud coming to light) when it's due; a life-changing one (coming out, a jackpot, a cult) once it has
 * waited BIG_EVENT_WAIT months for a day that didn't come.
 */
export function eventDayWanted(state: LifeState, facts: LifeFacts = computeFacts(state)): number | undefined {
  let best: number | undefined;
  const any = { ...facts, weekend: false };
  for (const p of state.story?.events?.pending ?? []) {
    const def = lifeEvent(p.id);
    // Only events that still fit this life (a marriage crisis needs a marriage) may bring a day.
    if (!def || !pendingApplies(state, p, def, any)) continue;
    const m = p.urgent ? p.due : def.big ? p.due + BIG_EVENT_WAIT : undefined;
    if (m !== undefined && (best === undefined || m < best)) best = m;
  }
  return best;
}

const SHARED_DAY_MONTHS = 8;
/** A big life event waits at most this long (months) for a played day before it brings its own. */
const BIG_EVENT_WAIT = 18;
const GRAVE_THEMES: FatedTheme[] = ["FAMILY_LOSS", "ILLNESS", "RELATIONSHIP_CRISIS"];
const GRAVE_ARCS: ArcType[] = ["PARTNER_PASSING", "PARENT_PASSING", "FAMILY_PASSING", "PET_FAREWELL", "ILLNESS", "AFFAIR", "DIVORCE", "PREGNANCY"];

/** Funerals, illness, betrayal, divorce… — never shares a day, and the day stays quiet around it. */
export function isGrave(state: LifeState, kind: string, ref: string): boolean {
  if (kind === "fated") return GRAVE_THEMES.includes(fatedEvent(state, ref)?.theme as FatedTheme);
  const arc = state.story?.arcs.find((a) => a.id === ref);
  return !arc || GRAVE_ARCS.includes(arc.type);
}

export function startArc(state: LifeState, type: ArcType, rng: SeededRandom, data?: ActiveArc["data"]): ActiveArc | undefined {
  const st = state.story!;
  if (st.arcs.some((a) => a.type === type)) return undefined;
  let order = ARC_ORDER[type];
  if (type === "DATING" && state.flags.skipFirstDate) {
    order = order.filter((k) => k !== "FIRST_DATE");
    delete state.flags.skipFirstDate;
  }
  let t = state.monthIndex;
  const steps = order.map((key) => {
    const def = ARCS[type].steps[key];
    t += rng.int(def.after[0], def.after[1]);
    return { key, dueMonth: t };
  });
  const arc: ActiveArc = { id: `arc${st.nextArcId++}`, type, steps, step: 0, data };
  st.arcs.push(arc);
  return arc;
}

function endArc(state: LifeState, type: ArcType): void {
  state.story!.arcs = state.story!.arcs.filter((a) => a.type !== type);
}

/** Keep arcs consistent with the life (e.g. start DATING when a relationship begins). */
export function ensureArcs(state: LifeState, rng: SeededRandom): void {
  const st = state.story!;
  const rel = state.relationship.status;
  if (rel === "DATING" && !state.engaged && !state.flags.longterm && !st.arcs.some((a) => a.type === "DATING" || a.type === "ENGAGEMENT")) startArc(state, "DATING", rng);
  if (rel !== "DATING") endArc(state, "DATING");
  if (rel === "DATING" || rel === "MARRIED") endArc(state, "TALKING");
  // Dating the destined person who lives in another city or country: long distance until someone moves.
  const life = st.fatedLife;
  const fatedPartner = !!state.relationship.partnerId && !!state.world?.npcs[state.relationship.partnerId]?.fated;
  // (Or you're the one who moved away — abroad for school or work — while dating them.)
  const far = !!life && ((life.from !== "same" && !state.flags.ldrDone) || !!state.relationship.longDistance);
  if (rel === "DATING" && fatedPartner && far && !st.arcs.some((a) => a.type === "LONG_DISTANCE")) {
    state.relationship.longDistance = true;
    startArc(state, "LONG_DISTANCE", rng);
  }
  if (!fatedPartner || (rel !== "DATING" && rel !== "MARRIED")) endArc(state, "LONG_DISTANCE");
  // While you live apart, the in-person steps (meeting your friends, a first date) wait until you're together.
  if (state.relationship.longDistance) {
    const dating = st.arcs.find((a) => a.type === "DATING");
    const step = dating?.steps[dating.step];
    if (step && IN_PERSON.includes(step.key) && step.dueMonth <= state.monthIndex + 1) step.dueMonth = state.monthIndex + 2;
  }
  if (rel !== "DATING" || !state.engaged) endArc(state, "ENGAGEMENT");
  if (rel !== "MARRIED") endArc(state, "DIVORCE");
  if (rel === "SINGLE" || rel === "DIVORCED") endArc(state, "PREGNANCY");
  if (!state.career.employed) endArc(state, "RETIREMENT");
  if (rel !== "DATING" && rel !== "MARRIED") {
    endArc(state, "AFFAIR");
    endArc(state, "PARTNER_PASSING");
    delete state.flags.partnerCritical;
  }
}

// ---------------------------------------------------------------------------
// Off-screen monthly background (small life; always leaves a card)
// ---------------------------------------------------------------------------

export function monthlyStoryTick(state: LifeState, rng: SeededRandom): void {
  const st = state.story;
  if (!st) return;
  const w = state.world;
  const age = Math.floor(state.age);
  if (w) w.country = state.location.country;
  ensureArcs(state, rng);
  // Living together with the destined person: their pay adds to the household (a doctor more than a barista).
  const fatedPid = state.relationship.partnerId;
  const job = st.fatedLife?.job;
  if (job && fatedPid && w?.npcs[fatedPid]?.fated && (state.relationship.status === "MARRIED" || state.flags.longterm)) state.money += job.income * 0.4 * (job.unstable ? rng.range(0, 2) : 1);
  // Retirement at 60 — on screen, with a farewell.
  const selfEmployed = ["own-business", "second-career"].includes(state.career.field ?? ""); // same rule as facts.selfEmployed
  if (state.career.employed && !selfEmployed && state.age >= RETIRE_AGE && !st.arcs.some((a) => a.type === "RETIREMENT")) startArc(state, "RETIREMENT", rng);
  // Very old parents: a goodbye day (never silent).
  for (const who of ["mom", "dad"] as const) {
    const p = state.family?.[who];
    if (p?.alive && state.date.year - p.birthYear >= 86 && rng.chance(annualMortality(state.date.year - p.birthYear) / 12) && !st.arcs.some((a) => a.type === "PARENT_PASSING")) {
      startArc(state, "PARENT_PASSING", rng, { who });
    }
  }
  // Pets age; a farewell day near the end of their life.
  for (const pet of state.pets ?? []) {
    const petAge = state.date.year - pet.adoptedYear + pet.ageAtAdoption;
    if (pet.alive && petAge >= 12 && rng.chance(0.02 + (petAge - 12) * 0.01) && !st.arcs.some((a) => a.type === "PET_FAREWELL")) startArc(state, "PET_FAREWELL", rng, { petId: pet.id });
  }
  // Grandparents and siblings (from setup): their passing is an on-screen day, never silent.
  const fam = state.family;
  if (fam && !st.arcs.some((a) => a.type === "FAMILY_PASSING")) {
    for (const g of fam.grandparents ?? []) {
      const gAge = state.date.year - g.birthYear;
      if (g.alive && gAge >= 75 && rng.chance(annualMortality(gAge) / 12)) {
        startArc(state, "FAMILY_PASSING", rng, { relativeId: g.id, relative: GRANDPARENT_WORD[g.rel].ko, relativeEn: GRANDPARENT_WORD[g.rel].en, card: "RELATIVE_FUNERAL" });
        break;
      }
    }
  }
  for (const sib of aliveSiblings(state)) {
    const sAge = state.date.year - sib.birthYear;
    const label = siblingLabel(state, sib).ko;
    if (!sib.married && sAge >= 27 && sAge <= 42 && rng.chance(0.004)) {
      sib.married = true;
      const en = siblingLabel(state, sib).en;
      queueChain(state, "INVITE_SIBLING_WEDDING", [0, 2], rng, { vars: { relative: label, relative_ko: label, relative_en: en } });
    } else if (sib.married && (sib.kids ?? 0) < 2 && sAge <= 42 && rng.chance(0.004)) {
      sib.kids = (sib.kids ?? 0) + 1;
      const en = siblingLabel(state, sib).en;
      queueChain(state, "NEPHEW_BORN", [0, 2], rng, { vars: { relative: label, relative_ko: label, relative_en: en } });
    } else if (sAge >= 55 && rng.chance((annualMortality(sAge) * 0.8) / 12) && !st.arcs.some((a) => a.type === "FAMILY_PASSING")) {
      startArc(state, "FAMILY_PASSING", rng, { relativeId: sib.id, relative: label, kind: "sibling", card: "FAMILY_FUNERAL" });
    }
  }
  // The destined person, if taken by someone else, may be single again one day (a reunion stays possible).
  const fatedNpc = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
  if (fatedNpc && !fatedNpc.single && !fatedNpc.deceased && state.relationship.partnerId !== fatedNpc.id && rng.chance(0.003)) fatedNpc.single = true;
  // The partner: an accident, a sudden collapse, or old age — the call, then the goodbye (never silent).
  const pid = state.relationship.partnerId;
  const partnered = state.relationship.status === "DATING" || state.relationship.status === "MARRIED";
  const busy = (t: ArcType) => st.arcs.some((a) => a.type === t);
  if (partnered && pid && !busy("PARTNER_PASSING") && !busy("ILLNESS")) {
    const pn = state.npcs.find((n) => n.id === pid);
    const pBirth = pn?.birth.year ?? w?.npcs[pid]?.birthYear;
    const pAge = pBirth ? state.date.year - pBirth : state.age;
    if (rng.chance((annualMortality(pAge) * 0.8 + (pAge < 65 ? 0.0015 : 0)) / 12)) {
      startArc(state, "PARTNER_PASSING", rng, { partnerId: pid, cause: pAge >= 75 ? "old" : rng.chance(0.5) ? "accident" : "sudden" });
    } else if (state.monthIndex - (state.relationship.sinceMonth ?? state.monthIndex) >= 12 && !state.flags[`affair:${pid}`] && !busy("AFFAIR") && !busy("DIVORCE") && !busy("ENGAGEMENT")) {
      // Finding out about an affair: rare, likelier when 궁합 with a destined partner is poor.
      const fatedPartner = !!w?.npcs[pid]?.fated;
      const bend = fatedPartner && st.compat ? compatFactor(st.compat.score, -1) : 1;
      if (rng.chance(0.0004 * bend)) {
        state.flags[`affair:${pid}`] = true;
        startArc(state, "AFFAIR", rng, { partnerId: pid });
      }
    }
  }
  // Kids start school at 7.
  for (const k of state.kids ?? []) {
    if (state.date.year - k.bornYear === 7 && state.date.month === 3) st.cards.push({ kind: "KID_SCHOOL", age, vars: { kid: k.name } });
  }
  // Friends marry and (much later) pass away. Only close friends get a card: at most FRIEND_CARD_CAP per kind
  // per life and FRIEND_CARD_GAP months apart, so each one still means something.
  if (w) {
    const lastCard = (k: string) => Number(state.flags[`card:${k}`] ?? -999);
    const cardOk = (k: string) => state.monthIndex - lastCard(k) >= FRIEND_CARD_GAP && Number(state.flags[`cards:${k}`] ?? 0) < FRIEND_CARD_CAP;
    const markCard = (k: string) => {
      state.flags[`card:${k}`] = state.monthIndex;
      state.flags[`cards:${k}`] = Number(state.flags[`cards:${k}`] ?? 0) + 1;
    };
    for (const rel of Object.values(w.relationships)) {
      if (rel.stage !== "FRIEND" && rel.stage !== "CLOSE_FRIEND") continue;
      const npc = w.npcs[rel.npcId];
      if (!npc || npc.deceased) continue;
      const a = npcAge(npc, state.date);
      const close = rel.stage === "CLOSE_FRIEND" || rel.closeness >= 0.5;
      if (npc.single && a >= 27 && a <= 45 && rng.chance(0.002)) {
        npc.single = false;
        if (close && cardOk("FRIEND_WEDDING")) {
          // An invitation on your next played day ("친구 ○○의 청첩장 모임에 초대받았습니다").
          queueChain(state, "INVITE_FRIEND_WEDDING", [0, 2], rng, { vars: { buddy: npc.name } });
          markCard("FRIEND_WEDDING");
        }
      } else if (a >= 50 && rng.chance((annualMortality(a) / 12) * 0.35)) {
        rel.stage = "DECEASED";
        npc.deceased = true;
        for (const k of Object.keys(w.populated)) w.populated[k] = w.populated[k].filter((id) => id !== npc.id);
        if (close && cardOk("FRIEND_FUNERAL")) {
          queueChain(state, "FRIEND_PASSING_NEWS", [0, 1], rng, { urgent: true, vars: { buddy: npc.name } });
          markCard("FRIEND_FUNERAL");
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Popups for fated/arc days
// ---------------------------------------------------------------------------

const strHash = (x: string) => {
  let h = 2166136261;
  for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * A variant applies only if its own `requires` hold AND its speaker can still speak (no texts from the dead).
 * Among the applicable ones the highest priority wins; ties are picked at random, stable per event.
 */
function variantIndex(theme: FatedTheme, facts: LifeFacts, eventId = ""): number {
  const ok = THEMES[theme].variants.map((v, i) => ({ v, i })).filter(({ v }) => meets(v.requires, facts) && meets(SPEAKER_REQUIRES[v.who] ?? [], facts));
  if (!ok.length) return -1;
  const top = Math.max(...ok.map(({ v }) => v.priority ?? 0));
  const best = ok.filter(({ v }) => (v.priority ?? 0) === top);
  return best[strHash(eventId) % best.length].i;
}

export function fatedEvent(state: LifeState, id: string): FatedEvent | undefined {
  return state.story?.script.find((e) => e.id === id);
}

export function hintFor(state: LifeState, id: string): Bi | undefined {
  const e = fatedEvent(state, id);
  if (!e) return;
  e.hinted = true;
  return THEMES[e.theme].hint;
}

/** Choose who is ill (parent, partner, friend — or the player later in life). */
function illnessPatient(state: LifeState, facts: LifeFacts, rng: SeededRandom): string {
  const opts: Array<{ item: string; weight: number }> = [];
  if (facts.momAlive) opts.push({ item: "mom", weight: 3 });
  if (facts.dadAlive) opts.push({ item: "dad", weight: 3 });
  if (facts.partnered) opts.push({ item: "partner", weight: 2 });
  if (facts.hasFriend) opts.push({ item: "friend", weight: 1 });
  if (state.age >= 55) opts.push({ item: "self", weight: 1 });
  return opts.length ? rng.weighted(opts) : "self";
}

export function patientLabel(state: LifeState, who: string | undefined, facts: LifeFacts): Bi {
  if (who === "mom") return { ko: "엄마", en: "Mom" };
  if (who === "dad") return { ko: "아빠", en: "Dad" };
  if (who === "partner") return { ko: facts.partnerName ?? "연인", en: facts.partnerName ?? "my partner" };
  if (who === "friend") return { ko: facts.friendName ?? "친구", en: facts.friendName ?? "a friend" };
  return { ko: "나", en: "I" };
}

/** `peek`: look without consuming (a turning point that doesn't apply yet is not dropped). */
export function storyPopup(state: LifeState, kind: "fated" | "arc", ref: string, facts: LifeFacts, rng: SeededRandom, opts: { peek?: boolean } = {}): StoryPopupDef | undefined {
  if (kind === "fated") {
    const e = fatedEvent(state, ref);
    if (!e || e.done) return;
    if (e.theme === "ILLNESS" && !e.data?.patient) e.data = { ...e.data, patient: illnessPatient(state, facts, rng) };
    if (e.theme === "FAMILY_LOSS" && !e.data?.relative) e.data = { ...e.data, ...pickRelative(state, rng) };
    const vi = variantIndex(e.theme, facts, e.id);
    if (vi < 0) {
      if (!opts.peek) e.done = true; // this turning point can't apply to this life right now
      return;
    }
    const v = THEMES[e.theme].variants[vi];
    const vars: Record<string, string> = {};
    if (e.data?.relative) vars.relative = String(e.data.relative);
    // Meeting the destined person: where depends on where they live and what they do.
    const plan = v.meet ? meetPlan(state, !!e.data?.again) : undefined;
    return { ref: `fated:${e.id}#${vi}`, who: v.who, line: plan?.line ?? v.line, choices: plan?.kind && plan.kind.choices.length === v.choices.length ? plan.kind.choices : v.choices.map((c) => c.t), location: plan?.location ?? v.location, activity: plan ? plan.activity : v.activity, needsFated: v.who === "fated" || !!v.withFated, vars, title: e.data?.again && v.meet ? { ko: "다시, 그 사람", en: "Them, again" } : v.title ?? THEMES[e.theme].title };
  }
  const arc = state.story!.arcs.find((a) => a.id === ref);
  if (!arc) return;
  const step = arc.steps[arc.step];
  // While you live apart, the in-person dating steps wait until you're in the same place.
  if (arc.type === "DATING" && state.relationship.longDistance && IN_PERSON.includes(step.key)) {
    if (!opts.peek) step.dueMonth = state.monthIndex + 2;
    return;
  }
  const def = ARCS[arc.type].steps[step.key];
  // A big moment's lead-up: parts 1–3 of 4, the same place and day as the climax.
  const sp = seqPart(state, arc, step.key);
  if (sp) {
    const title = { ko: sp.seq.titles.ko[sp.n], en: sp.seq.titles.en[sp.n] };
    return { ref: `arc:${arc.id}`, who: sp.who, line: themText(sp.line, arc), choices: sp.choices.map((c) => themText(c.t, arc)), location: def.location, activity: def.activity, vars: {}, title, needsFated: arc.type === "TALKING", needsPartner: arc.type === "DATING" && def.location !== "home" };
  }
  const mv = mbtiVariant(state, arc, step.key, def);
  const base = arcSpeaker(def, arc, facts, state);
  const who = mv?.who ?? base.who;
  const line = mv?.line ?? base.line;
  const location = mv?.location ?? base.location;
  const stepChoices = mv?.choices ?? def.choices;
  const vars: Record<string, string> = {};
  if (arc.data?.relative) vars.relative = String(arc.data.relative);
  if (arc.type === "PARENT_PASSING") {
    // 엄마/아빠 and 딸/아들 (the English UI turns them into Mom/Dad, daughter/son).
    vars.parent = arc.data?.who === "dad" ? "아빠" : "엄마";
    vars.child = state.birth.sex === "MALE" ? "아들" : "딸";
  }
  const loc = location ?? def.location;
  const online = loc === "instagram" || loc === "language_exchange_app" || loc === "dating_app" || loc === "online_community";
  const seqCur = SEQS[step.key] ? seqState(arc) : undefined;
  let climaxLine = line;
  let title = def.title;
  if (seqCur?.key === step.key) {
    title = { ko: SEQS[step.key].titles.ko[3], en: SEQS[step.key].titles.en[3] };
    // How the lead-up went colors the moment.
    const mood = seqCur.spark >= 0.25 ? themText({ ko: "(오늘따라 {them}의 눈빛이 유난히 따뜻하다.)", en: "(Tonight, {them}'s eyes are especially warm.)" }, arc) : seqCur.spark <= -0.15 ? { ko: "(어딘가 자꾸 엇갈린 하루였다. 그래도…)", en: "(Somehow the day kept missing its beat. Still…)" } : undefined;
    if (mood) climaxLine = { ko: `${mood.ko} ${line.ko}`, en: `${mood.en} ${line.en}` };
  }
  return { ref: `arc:${arc.id}`, who, line: climaxLine, choices: stepChoices.map((c) => c.t), location: loc, activity: def.activity, vars, title, needsFated: !online && (who === "fated" || !!def.withFated), needsPartner: (who === "partner" || arc.type === "DATING") && loc !== "home" };
}

/** A person's MBTI: the setup's for you and the destined person; a stable one of their own for anyone else. */
export function mbtiOf(state: LifeState, npcId?: string): string {
  if (!npcId) return String(state.flags.mbti ?? "");
  const n = state.world?.npcs[npcId];
  const set = n?.profile?.mbti as string | undefined;
  if (set) return set.toUpperCase();
  let h = 2166136261;
  for (const c of npcId) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return ["EI", "NS", "TF", "JP"].map((p, i) => p[(h >>> i) & 1]).join("");
}

/** The step variant that fits the two of you best (most MBTI letters matched), remembered per step. */
// ---------------------------------------------------------------------------
// Big moments as 4-part sequences (data/story/sequences.json): their move (their temperament) →
// your inner moment (your temperament, choices by your own letters) → the moment right before (both
// J/P) → the climax. Choices that fit the partner's MBTI add spark, which bends the climax.
// ---------------------------------------------------------------------------

type SeqChoice = { t: Bi; fits?: string; r?: Bi; rMiss?: Bi; me?: string };
type SeqPartDef = { line: Bi; choices: SeqChoice[] };
type SeqDef = { good: string; titles: { ko: string[]; en: string[] }; them: Record<string, SeqPartDef>; me: Record<string, Bi>; mePool: SeqChoice[]; pair: Record<"plan" | "free" | "mixed", SeqPartDef> };
const SEQS = seqData as unknown as Record<string, SeqDef>;

/** NF idealist, NT rational, SJ guardian, SP artisan. */
function temperament(m: string): "NF" | "NT" | "SJ" | "SP" {
  if (m.includes("N")) return m.includes("T") ? "NT" : "NF";
  return m.includes("J") ? "SJ" : "SP";
}

type SeqState = { key: string; n: number; spark: number };
/** Saved on the arc as plain strings (arc data is flat). */
function seqState(arc: ActiveArc): SeqState | undefined {
  const raw = arc.data?.seq;
  return typeof raw === "string" && raw ? (JSON.parse(raw) as SeqState) : undefined;
}
function seqDone(arc: ActiveArc): string[] {
  return String(arc.data?.seqDone ?? "").split(",").filter(Boolean);
}

/** The current lead-up part of a big moment (0–2), or undefined once it's time for the climax. */
function seqPart(state: LifeState, arc: ActiveArc, key: string): { n: number; who: string; line: Bi; choices: SeqChoice[]; theirs: string; seq: SeqDef; cur?: SeqState } | undefined {
  const seq = SEQS[key];
  if (!seq || seqDone(arc).includes(key)) return;
  const cur = seqState(arc);
  const n = cur?.key === key ? cur.n : 0;
  if (n >= 3) return;
  const pid = state.relationship.partnerId ?? Object.values(state.world?.npcs ?? {}).find((x) => x.fated)?.id;
  const mine = mbtiOf(state);
  const theirs = mbtiOf(state, pid);
  const them = arc.type === "TALKING" ? "fated" : "partner";
  if (n === 0) {
    const p = seq.them[temperament(theirs)];
    return { n, who: them, line: p.line, choices: p.choices, theirs, seq, cur };
  }
  if (n === 1) {
    const own = seq.mePool.filter((c) => !c.me || mine.includes(c.me));
    return { n, who: "me", line: seq.me[temperament(mine)], choices: (own.length >= 2 ? own : seq.mePool).slice(0, 3), theirs, seq, cur };
  }
  const js = [mine, theirs].filter((m) => m.includes("J")).length;
  const p = seq.pair[js === 2 ? "plan" : js === 0 ? "free" : "mixed"];
  return { n, who: "me", line: p.line, choices: p.choices, theirs, seq, cur };
}

/** {them} → the partner or the destined person (in 썸). */
function themText(b: Bi, arc: ActiveArc): Bi {
  const k = arc.type === "TALKING" ? "{fated}" : "{partner}";
  return { ko: b.ko.replaceAll("{them}", k), en: b.en.replaceAll("{them}", k) };
}

function mbtiVariant(state: LifeState, arc: ActiveArc, key: string, def: ArcStepDef) {
  if (!def.byMbti?.length) return;
  const mine = mbtiOf(state);
  const pid = state.relationship.partnerId ?? Object.values(state.world?.npcs ?? {}).find((n) => n.fated)?.id;
  const theirs = mbtiOf(state, pid);
  const has = (m: string, letters?: string) => !letters || [...letters].every((l) => m.includes(l));
  let best = -1;
  let bestScore = 0;
  def.byMbti.forEach((v, i) => {
    if (!has(mine, v.me) || !has(theirs, v.them)) return;
    // Equally good fits: a stable pick per couple and step (so different couples see different sides).
    let h = 0;
    for (const c of `${arc.id}:${key}:${i}:${pid}`) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    const score = (v.me?.length ?? 0) + (v.them?.length ?? 0) + (v.me && v.them ? 0.5 : 0) + (h % 100) / 1000;
    if (score > bestScore) (best = i), (bestScore = score);
  });
  return best >= 0 ? def.byMbti[best] : undefined;
}

/** Pick the arc step's speaker/line: by cause, or the first speaker who can still speak. */
function arcSpeaker(def: ArcStepDef, arc: ActiveArc, facts: LifeFacts, state?: LifeState): { who: string; line: Bi; location?: string } {
  if (def.alt && def.altBy === "distance") {
    const a = def.alt[state?.story?.fatedLife?.from ?? ""];
    if (a) return a;
  }
  if (def.alt && def.altBy === "parent") {
    const a = def.alt[String(arc.data?.who ?? "")];
    if (a) return a;
  }
  if (def.alt && def.altBy === "cause") {
    const a = def.alt[String(arc.data?.cause ?? "")];
    if (a) return a;
  }
  if (def.alt && def.altBy === "speaker") {
    const own = arc.data?.kind ? def.alt[String(arc.data.kind)] : undefined;
    if (own && meets(SPEAKER_REQUIRES[own.who] ?? [], facts)) return own;
    for (const [k, a] of Object.entries(def.alt)) if (k === a.who && meets(SPEAKER_REQUIRES[a.who] ?? [], facts)) return a;
  }
  return { who: def.who, line: def.line };
}

/** Which relative a FAMILY_LOSS "relative" variant is about: a living grandparent first, else an aunt/uncle. */
function pickRelative(state: LifeState, rng: SeededRandom): { relative: string; relativeEn: string; relativeId?: string } {
  const gps = (state.family?.grandparents ?? []).filter((g) => g.alive);
  if (gps.length) {
    const g = gps[rng.int(0, gps.length - 1)];
    return { relative: GRANDPARENT_WORD[g.rel].ko, relativeEn: GRANDPARENT_WORD[g.rel].en, relativeId: g.id };
  }
  const r = AUNTS_UNCLES[rng.int(0, AUNTS_UNCLES.length - 1)];
  return { relative: r.ko, relativeEn: r.en };
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface StoryResult {
  r: Bi;
  /** Who says the result line when it's someone's reply (default: narration, you). */
  who?: string;
  scene?: string[];
  outcome: string;
  /** A big moment's lead-up part: the next part (then the climax) follows right away, same day. */
  more?: boolean;
}

const FATE_BRIDGES: Bi[] = [
  { ko: "(마음먹은 것과 달리, 일은 다른 쪽으로 흘러갔다.)", en: "(Despite what you'd decided, things went another way.)" },
  { ko: "(그렇게 하려 했지만… 운명은 다른 길을 준비해 두었다.)", en: "(You meant to… but fate had another path ready.)" },
  { ko: "(뜻대로 되지 않았다. 어쩌면 처음부터 정해져 있었는지도.)", en: "(It didn't go as planned. Maybe it was always meant to be.)" },
];

function withBridge(r: Bi, rng: SeededRandom): Bi {
  const b = FATE_BRIDGES[rng.int(0, FATE_BRIDGES.length - 1)];
  return { ko: `${b.ko} ${r.ko}`, en: `${b.en} ${r.en}` };
}

export function resolveStory(ref: string, choiceIndex: number, ctx: StoryCtx, choiceLabel?: string): StoryResult | undefined {
  const { state, rng } = ctx;
  const st = state.story!;
  if (ref.startsWith("fated:")) {
    const [id, vis] = ref.slice(6).split("#");
    const e = fatedEvent(state, id)!;
    // Resolve against the exact variant the player saw.
    const v = THEMES[e.theme].variants[Number(vis ?? variantIndex(e.theme, ctx.facts, e.id))];
    const choice = v.choices[Math.max(0, Math.min(v.choices.length - 1, choiceIndex))];
    // 궁합 with the destined person is part of the chart's 70% whenever they are involved.
    let chart = e.chartWeights;
    if (v.compat && st.compat && (v.who === "fated" || v.withFated || ctx.facts.fatedPartner)) {
      const bent = Object.fromEntries(Object.entries(chart).map(([k, w]) => [k, w * compatFactor(st.compat!.score, v.compat![k] ?? 0)]));
      const t = Object.values(bent).reduce((a, b) => a + b, 0) || 1;
      chart = Object.fromEntries(Object.entries(bent).map(([k, w]) => [k, w / t]));
    }
    const outcome = resolveOutcome(chart, choice.weights, rng);
    e.done = true;
    e.outcome = outcome;
    const o = v.outcomes[outcome];
    applyEffects(o.effects, ctx, { event: e });
    ctx.facts = { ...ctx.facts, ...liveNames(state) };
    if (o.card) queueCard(state, o.card, ctx, e.data);
    flushFollowUpCards(state, ctx);
    // The chart (70%) overrode what the player asked for → say so, so the result never reads as a non sequitur.
    let r = (choice.weights[outcome] ?? 0) < 0.25 ? withBridge(o.r, rng) : o.r;
    if (e.theme === "LOVE_MEETING" && st.fatedLife) {
      // You got their name (and their city, their job) — or fate will bring them back around.
      const plan = v.meet ? meetPlan(state, !!e.data?.again) : undefined;
      // Results fit how you met (an app match doesn't "vanish into the crowd").
      const own = plan?.kind?.[outcome as "MISSED" | "SLOW_BURN"];
      if (own) r = r === o.r ? own : withBridge(own, rng);
      if (plan && outcome !== "MISSED") r = { ko: `${r.ko} ${plan.intro.ko}`, en: `${r.en} ${plan.intro.en}` };
      if (outcome !== "START_DATING") secondChance(state, e, rng);
    }
    return { r, who: r === o.r ? o.who : undefined, scene: o.scene, outcome };
  }
  const arc = st.arcs.find((a) => a.id === ref.slice(4));
  if (!arc) return;
  const step = arc.steps[arc.step];
  const def = ARCS[arc.type].steps[step.key];
  // A lead-up part: the partner reacts to how well your choice fits who they are; spark adds up.
  const sp = seqPart(state, arc, step.key);
  if (sp) {
    const c = sp.choices[Math.max(0, Math.min(sp.choices.length - 1, choiceIndex))];
    let fit = 0;
    for (const l of c.fits ?? "") fit += sp.theirs.includes(l) ? 0.15 : -0.1;
    arc.data = { ...arc.data, seq: JSON.stringify({ key: step.key, n: sp.n + 1, spark: (sp.cur?.key === step.key ? sp.cur.spark : 0) + fit }) };
    const r = fit < 0 && c.rMiss ? c.rMiss : c.r ?? { ko: "…", en: "…" };
    return { r: themText(r, arc), outcome: "SEQ", more: true };
  }
  const seqCur = SEQS[step.key] && seqState(arc)?.key === step.key ? seqState(arc) : undefined;
  if (SEQS[step.key]) {
    // The lead-up plays once; if this moment comes again later ("not yet"), it's just the moment.
    const done = seqDone(arc);
    arc.data = { ...arc.data, seq: "", seqDone: (done.includes(step.key) ? done : [...done, step.key]).join(",") };
  }
  const sparkBend = (k: string) => (seqCur && k === SEQS[step.key].good ? Math.max(0.4, Math.min(2, 1 + seqCur.spark * 1.5)) : 1);
  const mv = mbtiVariant(state, arc, step.key, def);
  const choices = mv?.choices ?? def.choices;
  const ch = choices[Math.max(0, Math.min(choices.length - 1, choiceIndex))];
  let outcome = ch.outcome ?? Object.keys(def.outcomes)[0];
  if (ch.roll) {
    const fatedHere = ctx.facts.fatedPartner || arc.type === "TALKING";
    // In 썸, how the texts / the not-a-date / the jealousy went (spark) matters as much as 궁합.
    const fatedNpc = arc.type === "TALKING" ? Object.values(state.world?.npcs ?? {}).find((n) => n.fated) : undefined;
    const spark = fatedNpc ? state.world?.relationships[fatedNpc.id]?.spark ?? 0.3 : 0;
    const bend = (k: string) => (st.compat && fatedHere ? compatFactor(st.compat.score, ch.compat?.[k] ?? 0) : 1) * (fatedNpc && k === "START" ? 0.3 + 1.4 * spark : 1);
    outcome = rng.weighted(Object.entries(ch.roll).map(([k, w]) => ({ item: k, weight: w * bend(k) * sparkBend(k) })));
  }
  const o = { ...def.outcomes[outcome], ...(mv?.outcomes?.[outcome] ?? {}) };
  arc.step += 1;
  applyEffects(o.effects, ctx, { arc, choiceLabel });
  ctx.facts = { ...ctx.facts, ...liveNames(state) };
  if (o.card) queueCard(state, o.card, ctx, arc.data);
  flushFollowUpCards(state, ctx);
  if (arc.step >= arc.steps.length) st.arcs = st.arcs.filter((a) => a !== arc);
  if (arc.type === "ILLNESS" && step.key === "RESULT") return { r: illnessResultText(arc), scene: arc.data?.passed ? ["funeral_hall"] : undefined, outcome };
  // An unlikely roll for what you chose ("not today" → you're together anyway): say that fate stepped in.
  const unlikely = !!ch.roll && (ch.roll[outcome] ?? 0) < 0.25;
  return { r: unlikely ? withBridge(o.r, rng) : o.r, who: unlikely ? undefined : o.who, scene: o.scene, outcome };
}

/**
 * A missed meeting (or a slow burn) with the destined person isn't the end: fate brings them around
 * again in the next year that's good for *both* charts (at most twice).
 */
function secondChance(state: LifeState, e: FatedEvent, rng: SeededRandom): void {
  const st = state.story!;
  const life = st.fatedLife;
  const fated = Object.values(state.world?.npcs ?? {}).find((n) => n.fated);
  if (!life || life.retries <= 0 || !fated || fated.deceased || !fated.single || state.relationship.partnerId === fated.id) return;
  life.retries -= 1;
  const now = Math.floor(state.age);
  const years = (st.loveYears ?? []).filter((y) => y.age >= now + 2 && y.age <= now + 7);
  const pick = years[0] ?? { age: now + rng.int(2, 5), score: 0, tags: [] };
  const id = `LOVE_MEETING@${pick.age}r${life.retries}`;
  if (st.script.some((x) => x.id === id)) return;
  st.script.push({ id, theme: "LOVE_MEETING", age: pick.age, monthIndex: pick.age * 12 + rng.int(1, 10), chartWeights: e.chartWeights, signals: pick.tags.length ? pick.tags : e.signals, data: { again: true } });
  st.script.sort((a, b) => a.monthIndex - b.monthIndex);
}

/** Partner/friend names as they are *after* an outcome (e.g. the person you just started dating). */
function liveNames(state: LifeState): { partnerName?: string } {
  const pid = state.relationship.partnerId;
  const name = pid ? state.npcs.find((n) => n.id === pid)?.name ?? state.world?.npcs[pid]?.name : undefined;
  return name ? { partnerName: name } : {};
}

function flushFollowUpCards(state: LifeState, ctx: StoryCtx): void {
  const k = state.flags.followUpCard as string | undefined;
  if (k) {
    queueCard(state, k, ctx);
    delete state.flags.followUpCard;
  }
}

function illnessResultText(arc: ActiveArc): Bi {
  const who = arc.data?.patientName as string;
  if (arc.data?.passed && (arc.data.patient === "mom" || arc.data.patient === "dad"))
    return { ko: `…더 이상 할 수 있는 치료가 없다고 했다. ${who} 곁에 있어 드리라고 했다.`, en: `…There was nothing more they could do. They told you to stay with ${who}.` };
  return arc.data?.passed
    ? { ko: `…${who}은(는) 끝내 이겨내지 못했다.`, en: `…${who} couldn't overcome it in the end.` }
    : { ko: `완치 판정을 받았다! ${who}와(과) 함께 울었다.`, en: `Declared cancer-free! You cried together with ${who}.` };
}

export function queueCard(state: LifeState, kind: string, ctx: StoryCtx, data?: Record<string, unknown>): void {
  const f = ctx.facts;
  const lastPet = (state.pets ?? []).at(-1);
  const lastKid = (state.kids ?? []).at(-1);
  const who = data?.patient ? String(data.patient) : "self";
  const pl = patientLabel(state, who, f);
  // You in the hospital yourself: a card of your own (never "'s illness" with a blank name).
  if (kind === "HOSPITAL" && who === "self") kind = "HOSPITAL_SELF";
  const patient = pl.ko;
  // Remember who the partner on this card is (a divorce card is made after they've left).
  const pname = f.partnerName ?? (state.flags.lastPartnerName as string | undefined);
  const pnpc = state.relationship.partnerId ? { id: state.relationship.partnerId } : pname ? { id: state.npcs.find((n) => n.name === pname)?.id ?? Object.values(state.world?.npcs ?? {}).find((n) => n.name === pname)?.id } : undefined;
  const psex = pnpc?.id ? state.world?.npcs[pnpc.id]?.sex ?? state.npcs.find((n) => n.id === pnpc.id)?.birth.sex : undefined;
  state.story!.cards.push({
    kind,
    age: Math.floor(state.age),
    vars: {
      partner: f.partnerName ?? (state.flags.lastPartnerName as string) ?? "",
      friend: (data?.friend as string) ?? f.friendName ?? "",
      relative: (data?.relative as string) ?? "",
      kid: lastKid?.name ?? "",
      pet: (data?.petName as string) ?? lastPet?.name ?? "",
      patient,
      partnerId: pnpc?.id ?? "",
      partnerSex: psex ?? "",
      patient_ko: pl.ko,
      patient_en: pl.en,
      city: state.location.city,
      sibling: f.siblingName ?? "",
      ex: f.exName ?? "",
      me: state.name,
      ...((data?.vars as Record<string, string> | undefined) ?? {}),
    },
  });
}

/** Start dating a world NPC (the destined person or someone new). */
function beginDating(state: LifeState, npc: WorldNpc, rng: SeededRandom): void {
  const w = state.world;
  if (!w) return;
  npc.single = false;
  w.relationships[npc.id] ??= { npcId: npc.id, stage: "ACQUAINTANCE", closeness: 0.3, spark: 0.5, conversations: 3, origin: { type: "RANDOM_ENCOUNTER", locationId: "cafe", firstEncounterDate: { ...state.date } }, lastContact: { ...state.date }, channel: "IN_PERSON", metOffline: true };
  w.relationships[npc.id].stage = "PARTNER";
  if (!state.npcs.some((n) => n.id === npc.id)) {
    const birth = { year: npc.birthYear, month: npc.birthMonth, day: npc.birthDay, sex: npc.sex };
    state.npcs.push({ id: npc.id, name: npc.name, birth, chart: calculateNatalChart(birth), role: "PARTNER", metAt: { ...state.date } });
  }
  state.relationship = { status: "DATING", partnerId: npc.id, sinceMonth: state.monthIndex };
  state.flags.lastPartnerName = npc.name;
  startArc(state, "DATING", rng);
}

/** A parent has died: a letter, a feud over the will, a secret at the funeral… may follow. */
function parentHooks(state: LifeState, who: "mom" | "dad", rng: SeededRandom): void {
  fireHooks(state, "parentDies", rng, { who, vars: { who_ko: who === "mom" ? "엄마" : "아빠", who_en: who === "mom" ? "Mom" : "Dad" } });
}

/** The partner has died: widowed, their arcs end, they never text again. */
function partnerDies(state: LifeState, rng: SeededRandom): void {
  const w = state.world;
  const pid = state.relationship.partnerId;
  if (pid) state.flags.lastPartnerName = (state.npcs.find((n) => n.id === pid)?.name ?? w?.npcs[pid]?.name ?? state.flags.lastPartnerName ?? "") as string;
  if (pid && w?.relationships[pid]) w.relationships[pid].stage = "DECEASED";
  if (pid && w?.npcs[pid]) {
    w.npcs[pid].deceased = true;
    for (const k of Object.keys(w.populated)) w.populated[k] = w.populated[k].filter((id) => id !== pid);
  }
  const n = pid ? state.npcs.find((x) => x.id === pid) : undefined;
  if (n) n.role = "DECEASED" as typeof n.role;
  state.relationship = { status: "SINGLE" };
  state.engaged = false;
  state.flags.widowed = true;
  delete state.flags.partnerCritical;
  fireHooks(state, "partnerDies", rng, { vars: { who_ko: String(state.flags.lastPartnerName ?? ""), who_en: String(state.flags.lastPartnerName ?? "") } });
  for (const t of ["DATING", "ENGAGEMENT", "DIVORCE", "PREGNANCY", "AFFAIR", "PARTNER_PASSING"] as ArcType[]) endArc(state, t);
}

/** Story effects (money, flags, dating, arcs, kids, pets…) — shared with the life-event runtime. */
export function applyStoryEffects(effects: StoryEffect[], ctx: StoryCtx, src: { event?: FatedEvent; arc?: ActiveArc; choiceLabel?: string } = {}): void {
  applyEffects(effects, ctx, src);
}

function applyEffects(effects: StoryEffect[], ctx: StoryCtx, src: { event?: FatedEvent; arc?: ActiveArc; choiceLabel?: string }): void {
  const { state, rng } = ctx;
  const w = state.world;
  for (const eff of effects) {
    switch (eff.kind) {
      case "startDatingFated": {
        let npc = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
        if (w && !npc) {
          npc = generateNpc(w, rng, { type: "regular_customer", region: w.homeRegion, date: state.date, aroundAge: state.age, persistence: "PERSISTENT", sex: likedSex(state, rng) });
          npc.fated = true;
        }
        if (npc) {
          // Someone who lives in another city or country: long distance from day one (the video call is the first date).
          const far = !!state.story?.fatedLife && state.story.fatedLife.from !== "same";
          if (far) state.flags.skipFirstDate = true;
          beginDating(state, npc, rng);
          if (far) state.relationship.longDistance = true;
        }
        break;
      }
      case "startDatingNew": {
        // Someone new (a blind date, a friend's introduction) — not the destined person.
        if (!w) break;
        // Born the sex you like — so the name fits too (a boyfriend is never 예린).
        const npc = generateNpc(w, rng, { type: "regular_customer", region: w.homeRegion, date: state.date, aroundAge: state.age, persistence: "PERSISTENT", sex: likedSex(state, rng) });
        beginDating(state, npc, rng);
        break;
      }
      case "addKids": {
        // Twins (or more): names picked for them.
        const n = Number(eff.count ?? 1);
        for (let i = 0; i < n; i++) {
          const sex = rng.chance(0.5) ? "MALE" : "FEMALE";
          const name = pickName(sex, localCulture(state), rng, (state.kids ?? []).map((k) => k.name));
          (state.kids ??= []).push({ id: `kid${(state.kids?.length ?? 0) + 1}`, name, sex, bornYear: state.date.year, bornMonth: state.date.month, spriteSeed: rng.int(0, 999999) });
        }
        break;
      }
      case "adoptKid": {
        const age = rng.int(2, 6);
        const sex = rng.chance(0.5) ? "MALE" : "FEMALE";
        (state.kids ??= []).push({ id: `kid${(state.kids?.length ?? 0) + 1}`, name: pickName(sex, localCulture(state), rng, (state.kids ?? []).map((k) => k.name)), sex, bornYear: state.date.year - age, bornMonth: rng.int(1, 12), spriteSeed: rng.int(0, 999999) });
        break;
      }
      case "startDatingEx": {
        // Getting back together with the last ex (if they're still around).
        const ex = [...state.npcs].reverse().find((n) => n.role === "EX");
        const wn = ex && w ? w.npcs[ex.id] : undefined;
        if (wn && !wn.deceased) beginDating(state, wn, rng);
        else if (ex && w) {
          const npc = generateNpc(w, rng, { type: "regular_customer", region: w.homeRegion, date: state.date, aroundAge: state.age, persistence: "PERSISTENT", sex: ex.birth.sex });
          npc.name = ex.name;
          beginDating(state, npc, rng);
        }
        break;
      }
      case "illness": {
        // Someone gets seriously ill (from an event, e.g. a checkup that finds something).
        const who = String(eff.patient ?? "self");
        // outlook "good": caught early / a scare — it's almost always going to be fine.
        const good = eff.outlook === "good";
        const outcome = rng.weighted([
          { item: "RECOVERY", weight: good ? 0.85 : 0.6 },
          { item: "LONG_FIGHT", weight: good ? 0.15 : 0.3 },
          { item: "PASSING", weight: good || (who === "self" && state.age < 60) ? 0 : 0.1 },
        ]);
        startArc(state, "ILLNESS", rng, { patient: who, patientName: patientLabel(state, who, ctx.facts).ko, outcome });
        break;
      }
      case "loseMoneyTo": {
        // Savings gone (a scam, a vanishing partner…): a share of what you have, at least `min`.
        const share = Number(eff.share ?? 0.5);
        state.money -= Math.max(Number(eff.min ?? 5), Math.max(0, state.money) * share);
        break;
      }
      case "petLost": {
        const pet = (state.pets ?? []).filter((p) => p.alive).at(-1);
        if (pet) (pet.alive = false), (state.flags.lostPet = pet.id);
        break;
      }
      case "petFound": {
        const pet = state.pets?.find((p) => p.id === state.flags.lostPet);
        if (pet) pet.alive = true;
        delete state.flags.lostPet;
        break;
      }
      case "siblingMarries": {
        const sib = (state.family?.siblings ?? []).find((x) => x.alive && !x.married);
        if (sib) sib.married = true;
        break;
      }
      case "clearFlag":
        delete state.flags[String(eff.name)];
        break;
      case "dropOut":
        // Leaving school before graduating (the late degree, the doctorate…).
        state.enrollment = undefined;
        break;
      case "startDatingFriend": {
        // Friends to lovers: the closest friend of the sex you're drawn to becomes the partner.
        const npc = ctx.facts.crushId && w ? w.npcs[ctx.facts.crushId] : undefined;
        if (npc) beginDating(state, npc, rng);
        break;
      }
      case "loseFriend": {
        // A friendship ends (betrayal, a falling-out, a debt never repaid).
        const best = w ? Object.values(w.relationships).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").sort((a, b) => b.closeness - a.closeness)[0] : undefined;
        if (best) (best.stage = "LOST_CONTACT"), (best.closeness = Math.min(best.closeness, 0.1));
        break;
      }
      case "newFriend": {
        if (!w) break;
        const npc = generateNpc(w, rng, { type: "regular_customer", region: w.homeRegion, date: state.date, aroundAge: state.age, persistence: "PERSISTENT" });
        w.relationships[npc.id] = { npcId: npc.id, stage: "FRIEND", closeness: 0.55, spark: 0, conversations: 8, origin: { type: "OLD_FRIEND", firstEncounterDate: { ...state.date } }, lastContact: { ...state.date }, channel: "IN_PERSON", metOffline: true };
        break;
      }
      case "addSibling": {
        // A half-sibling shows up, a twin separated at birth…
        const fam = state.family;
        if (!fam) break;
        const twin = !!eff.twin;
        const sex = rng.chance(0.5) ? "MALE" : "FEMALE";
        const birthYear = twin ? state.birth.year : state.birth.year + rng.int(3, 15);
        const rel = twin ? (sex === "MALE" ? "OLDER_BROTHER" : "OLDER_SISTER") : sex === "MALE" ? "YOUNGER_BROTHER" : "YOUNGER_SISTER";
        (fam.siblings ??= []).push({ id: `sib${(fam.siblings?.length ?? 0) + 1}`, rel, name: pickName(sex, "KR", rng, (fam.siblings ?? []).map((x) => x.name)), sex, birthYear, alive: true, spriteSeed: rng.int(0, 999999) });
        break;
      }
      case "queueEvent":
        // A life event set up by the story (a letter found after a funeral, an inheritance feud…).
        if (rng.chance(Number(eff.p ?? 1))) queueChain(state, String(eff.to), (eff.after as [number, number]) ?? [0, 3], rng, { urgent: !!eff.urgent, vars: eff.vars as Record<string, string> | undefined });
        break;
      case "fatedTaken": {
        // The destined person is with someone else now (they may be single again one day).
        const npc = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
        if (npc) npc.single = false;
        break;
      }
      case "partnerCritical":
        state.flags.partnerCritical = true;
        break;
      case "partnerDies":
        partnerDies(state, rng);
        break;
      case "relativeDies": {
        const id = String(src.arc?.data?.relativeId ?? src.event?.data?.relativeId ?? "");
        const fam = state.family;
        const gp = fam?.grandparents?.find((g) => g.id === id);
        if (gp) {
          gp.alive = false;
          fireHooks(state, "grandparentDies", rng, { vars: { who_ko: GRANDPARENT_WORD[gp.rel].ko, who_en: GRANDPARENT_WORD[gp.rel].en } });
        }
        const sib = fam?.siblings?.find((x) => x.id === id);
        if (sib) {
          sib.alive = false;
          const l = siblingLabel(state, sib);
          fireHooks(state, "siblingDies", rng, { vars: { who_ko: l.ko, who_en: sib.name } });
        }
        if (src.arc?.type === "FAMILY_PASSING") queueCard(state, String(src.arc.data?.card ?? "RELATIVE_FUNERAL"), ctx, src.arc.data);
        break;
      }
      case "sparkFated": {
        const npc = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
        if (npc && w) {
          const r = (w.relationships[npc.id] ??= { npcId: npc.id, stage: "ACQUAINTANCE", closeness: 0.25, spark: 0, conversations: 2, origin: { type: "RANDOM_ENCOUNTER", locationId: "cafe", firstEncounterDate: { ...state.date } }, lastContact: { ...state.date }, channel: "IN_PERSON", metOffline: true });
          r.spark = Math.min(1, r.spark + Number(eff.amount ?? 0.3));
        }
        break;
      }
      case "engage":
        state.engaged = true;
        endArc(state, "DATING");
        startArc(state, "ENGAGEMENT", rng);
        break;
      case "marry":
        applyConsequences(state, [{ kind: "marry" }], { rng, modifiers: ctx.mods, log: [] });
        state.engaged = false;
        state.flags.followUpCard = "NEW_HOME";
        break;
      case "separate":
        if (state.relationship.status === "MARRIED") startArc(state, "DIVORCE", rng);
        else applyEffects([{ kind: "breakUp" }], ctx, src);
        break;
      case "breakUp": {
        const partner = state.relationship.partnerId;
        if (partner) state.flags.lastPartnerName = (state.npcs.find((n) => n.id === partner)?.name ?? w?.npcs[partner]?.name ?? "") as string;
        applyConsequences(state, [eff as Consequence], { rng, modifiers: ctx.mods, log: [] });
        if (partner && w?.relationships[partner]) w.relationships[partner].stage = "EX";
        state.engaged = false;
        endArc(state, "DATING");
        endArc(state, "ENGAGEMENT");
        endArc(state, "PREGNANCY");
        break;
      }
      case "arc": {
        const type = eff.type as ArcType;
        const data: ActiveArc["data"] = {};
        if (type === "ILLNESS" && src.event) {
          const who = String(src.event.data?.patient ?? "self");
          data.patient = who;
          data.patientName = patientLabel(state, who, ctx.facts).ko;
          data.outcome = src.event.outcome ?? "RECOVERY";
        }
        startArc(state, type, rng, data);
        break;
      }
      case "endArc":
        if (src.arc) state.story!.arcs = state.story!.arcs.filter((a) => a !== src.arc);
        break;
      case "arcRepeat":
        // The same step again after a while (still apart: "let's hold on a little longer") — once.
        if (src.arc && src.arc.step > 0 && src.arc.steps.filter((x) => x.key === src.arc!.steps[src.arc!.step - 1].key).length < 2) {
          const [a, b] = eff.after as [number, number];
          src.arc.steps.splice(src.arc.step, 0, { key: src.arc.steps[src.arc.step - 1].key, dueMonth: state.monthIndex + rng.int(a, b) });
        } else if (src.arc?.type === "TALKING" && src.arc.step >= src.arc.steps.length) {
          // Still couldn't say it — the 썸 fades, but fate brings them around again.
          applyEffects([{ kind: "fatedSecondChance" }], ctx, src);
        }
        break;
      case "fatedSecondChance": {
        const fake = { id: "TALKING", theme: "LOVE_MEETING", age: Math.floor(state.age), monthIndex: state.monthIndex, chartWeights: { START_DATING: 0.5, SLOW_BURN: 0.3, MISSED: 0.2 }, signals: [] } as FatedEvent;
        secondChance(state, fake, rng);
        break;
      }
      case "moveToFated": {
        // You move to where they live.
        const life = state.story?.fatedLife;
        if (!life) break;
        const abroad = life.city.country !== "KR";
        state.location = { country: abroad ? COUNTRY_NAME[life.city.country] ?? life.city.country : state.location.country, city: life.city.en };
        if (abroad) (state.flags.livedAbroad = true), state.career.employed && (state.career.abroad = true);
        life.from = "same";
        state.relationship.longDistance = false;
        state.flags.ldrDone = true;
        endArc(state, "LONG_DISTANCE");
        break;
      }
      case "fatedMovesHere": {
        const life = state.story?.fatedLife;
        if (life) life.from = "same";
        state.relationship.longDistance = false;
        state.flags.ldrDone = true;
        endArc(state, "LONG_DISTANCE");
        break;
      }
      case "arcStepAgain":
        // "Not yet": the next step (e.g. the last-chance talk) comes after a while.
        if (src.arc && src.arc.steps[src.arc.step]) {
          const [a, b] = eff.after as [number, number];
          src.arc.steps[src.arc.step].dueMonth = state.monthIndex + rng.int(a, b);
        }
        break;
      case "parentCritical": {
        // The hospital calls: the last night comes as its own day (last words → funeral → the empty days).
        const who = (eff.who as "mom" | "dad" | undefined) ?? "mom";
        if (!state.family?.[who]?.alive || state.story!.arcs.some((a) => a.type === "PARENT_PASSING")) break;
        const arc = startArc(state, "PARENT_PASSING", rng, { who });
        if (arc) arc.steps[0].dueMonth = state.monthIndex + 1;
        break;
      }
      case "parentDies": {
        const who = (eff.who as "mom" | "dad" | undefined) ?? (src.arc?.data?.who as "mom" | "dad" | undefined) ?? "mom";
        if (state.family?.[who]) state.family[who].alive = false;
        parentHooks(state, who, rng);
        if (src.arc?.type === "PARENT_PASSING") queueCard(state, who === "mom" ? "MOM_FUNERAL" : "DAD_FUNERAL", ctx);
        break;
      }
      case "adoptPet": {
        const species = eff.species as "DOG" | "CAT";
        const pet = { id: `pet${(state.pets?.length ?? 0) + 1}`, name: petName(species, rng), species, adoptedYear: state.date.year, ageAtAdoption: rng.int(0, 3), alive: true, spriteSeed: rng.int(0, 999999) };
        (state.pets ??= []).push(pet);
        break;
      }
      case "petDies": {
        const pet = state.pets?.find((p) => p.id === src.arc?.data?.petId) ?? state.pets?.find((p) => p.alive);
        if (pet) pet.alive = false;
        break;
      }
      case "retire":
        if (state.career.employed) state.career.cid = (state.career.cid ?? 0) + 1;
        state.career.employed = false;
        state.flags.retired = true;
        state.flags.jobLostMonth = undefined as unknown as number;
        endArc(state, "RETIREMENT");
        break;
      case "addKid": {
        // Stored in its Korean form (the English UI shows the English pair); the name says boy or girl.
        const known = src.choiceLabel ? nameKo(src.choiceLabel) : undefined;
        const name = known?.ko ?? src.choiceLabel ?? "아가";
        (state.kids ??= []).push({ id: `kid${(state.kids?.length ?? 0) + 1}`, name, sex: known && known.ko !== "하늘" ? known.sex : rng.chance(0.5) ? "MALE" : "FEMALE", bornYear: state.date.year, bornMonth: state.date.month, spriteSeed: rng.int(0, 999999) });
        if (state.flags.twins) {
          // Twins: the second one gets a name too.
          delete state.flags.twins;
          applyEffects([{ kind: "addKids", count: 1 }], ctx, src);
        }
        break;
      }
      case "illnessResult": {
        const arc = src.arc!;
        const who = String(arc.data?.patient ?? "self");
        let out = String(arc.data?.outcome ?? "RECOVERY");
        if (out === "LONG_FIGHT") out = rng.chance(0.55) ? "RECOVERY" : "PASSING";
        if (out === "PASSING" && who === "self" && state.age < 60) out = "RECOVERY";
        if (out === "RECOVERY") {
          arc.data = { ...arc.data, passed: false };
          queueCard(state, "RECOVERED", ctx, arc.data);
          break;
        }
        arc.data = { ...arc.data, passed: true };
        if (who === "mom" || who === "dad") {
          // Not a one-line notice: the last night at the hospital comes as its own day.
          applyEffects([{ kind: "parentCritical", who }], ctx, src);
        } else if (who === "partner") {
          state.flags.lastPartnerName = String(arc.data.patientName ?? "");
          queueCard(state, "PARTNER_FUNERAL", ctx);
          partnerDies(state, rng);
        } else if (who === "friend") {
          const best = w ? Object.values(w.relationships).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").sort((a, b) => b.closeness - a.closeness)[0] : undefined;
          if (best) {
            best.stage = "DECEASED";
            if (w?.npcs[best.npcId]) w.npcs[best.npcId].deceased = true;
          }
          queueCard(state, "FRIEND_FUNERAL", ctx, { friend: (best && w?.npcs[best.npcId]?.name) || ctx.facts.friendName || "" });
        } else {
          state.alive = false;
          state.diedAtMonth = state.monthIndex;
        }
        break;
      }
      default:
        applyConsequences(state, [eff as Consequence], { rng, modifiers: ctx.mods, log: [] });
    }
  }
}

export function fillStory(text: string, state: LifeState, facts: LifeFacts, extra: Record<string, string> = {}): string {
  const pet = (state.pets ?? []).filter((p) => p.alive).at(-1)?.name ?? (state.pets ?? []).at(-1)?.name ?? "";
  return fillNames(text, { ...extra, partner: facts.partnerName ?? "", friend: facts.friendName ?? "", crush: facts.crushName ?? "", fated: facts.fatedName ?? "", pet, patient: extra.patient ?? "", relative: extra.relative ?? "", kid: (state.kids ?? []).at(-1)?.name ?? "" });
}
