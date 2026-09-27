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
import fatedData from "../../data/story/fatedEvents.json";
import arcData from "../../data/story/arcs.json";
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
import type { LifeFacts } from "../game/facts";
import { meets } from "../game/facts";
import { SPEAKER_REQUIRES } from "../game/director";
import { fillNames } from "../game/text";
import { buildDestinyScript, resolveOutcome } from "./destinyScript";
import type { ActiveArc, ArcType, FatedEvent, FatedTheme, StoryState } from "./types";

type Bi = { ko: string; en: string };
type StoryEffect = Consequence | { kind: string; [k: string]: unknown };

interface FatedVariant {
  requires: string[];
  location: string;
  activity?: string;
  who: string;
  line: Bi;
  choices: Array<{ t: Bi; weights: Record<string, number> }>;
  outcomes: Record<string, { r: Bi; effects: StoryEffect[]; card?: string; scene?: string[] }>;
}
interface ArcStepDef {
  after: [number, number];
  location: string;
  activity?: string;
  who: string;
  line: Bi;
  choices: Array<{ t: Bi; outcome: string }>;
  outcomes: Record<string, { r: Bi; effects: StoryEffect[]; card?: string; scene?: string[] }>;
}

const THEMES = fatedData.themes as unknown as Record<FatedTheme, { hint: Bi; variants: FatedVariant[] }>;
const ARCS = arcData.arcs as unknown as Record<ArcType, { steps: Record<string, ArcStepDef> }>;
const ARC_ORDER: Record<ArcType, string[]> = {
  DATING: ["FIRST_DATE", "PROPOSAL", "LAST_CHANCE"],
  ENGAGEMENT: ["MEET_PARENTS", "WEDDING"],
  DIVORCE: ["COURT"],
  PREGNANCY: ["BIRTH"],
  RETIREMENT: ["FAREWELL"],
  PARENT_PASSING: ["GOODBYE"],
  PET_FAREWELL: ["GOODBYE"],
  ILLNESS: ["TREATMENT", "RESULT"],
};
const PET_NAMES = { DOG: ["콩이", "보리", "몽이", "초코", "두부"], CAT: ["나비", "치즈", "모모", "레오", "까미"] };
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
}

export interface StoryPopupDef {
  ref: string;
  who: string;
  line: Bi;
  choices: Bi[];
  location: string;
  activity?: string;
  needsFated?: boolean;
}

// ---------------------------------------------------------------------------
// Setup & scheduling
// ---------------------------------------------------------------------------

export function initStory(state: LifeState, birth: BirthData, place: BirthPlace | undefined, seed: number): StoryState {
  const saju = state.chart ?? calculateNatalChart(birth);
  const astro = calculateAstrologyChart(birth, place ?? DEFAULT_BIRTHPLACE);
  const script = buildDestinyScript(saju, astro, { birthYear: birth.year, seed, startAge: Math.floor(state.age) });
  state.story = { script, arcs: [], log: [], nextArcId: 1, cards: [] };
  return state.story;
}

/** Calm days only when nothing big happens for a long while (keeps a life ≈ 18–24 played days). */
function maxGapMonths(age: number): number {
  return age < 40 ? 42 : age < 60 ? 60 : 96;
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
  for (const e of st.script) {
    if (e.done) continue;
    cands.push({ month: Math.max(now + 1, e.monthIndex), kind: "fated", ref: e.id, prio: 3 });
  }
  for (const a of st.arcs) {
    const step = a.steps[a.step];
    if (step) cands.push({ month: Math.max(now + 1, step.dueMonth), kind: "arc", ref: a.id, prio: 2 });
  }
  cands.push({ month: now + Math.max(2, Math.round(maxGapMonths(state.age) * rng.range(0.75, 1))), kind: "calm", prio: 0 });
  cands.sort((a, b) => a.month - b.month || b.prio - a.prio);
  const next = { month: Math.max(now + 1, cands[0].month), kind: cands[0].kind, ref: cands[0].ref };
  st.nextDay = next;
  return next;
}

export function startArc(state: LifeState, type: ArcType, rng: SeededRandom, data?: ActiveArc["data"]): ActiveArc | undefined {
  const st = state.story!;
  if (st.arcs.some((a) => a.type === type)) return undefined;
  const order = ARC_ORDER[type];
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
  if (rel !== "DATING" || !state.engaged) endArc(state, "ENGAGEMENT");
  if (rel !== "MARRIED") endArc(state, "DIVORCE");
  if (rel === "SINGLE" || rel === "DIVORCED") endArc(state, "PREGNANCY");
  if (!state.career.employed) endArc(state, "RETIREMENT");
}

// ---------------------------------------------------------------------------
// Off-screen monthly background (small life; always leaves a card)
// ---------------------------------------------------------------------------

export function monthlyStoryTick(state: LifeState, rng: SeededRandom): void {
  const st = state.story;
  if (!st) return;
  const w = state.world;
  const age = Math.floor(state.age);
  ensureArcs(state, rng);
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
          st.cards.push({ kind: "FRIEND_WEDDING", age, vars: { friend: npc.name } });
          markCard("FRIEND_WEDDING");
        }
      } else if (a >= 50 && rng.chance((annualMortality(a) / 12) * 0.35)) {
        rel.stage = "DECEASED";
        npc.deceased = true;
        for (const k of Object.keys(w.populated)) w.populated[k] = w.populated[k].filter((id) => id !== npc.id);
        if (close && cardOk("FRIEND_FUNERAL")) {
          st.cards.push({ kind: "FRIEND_FUNERAL", age, vars: { friend: npc.name } });
          markCard("FRIEND_FUNERAL");
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Popups for fated/arc days
// ---------------------------------------------------------------------------

/** A variant applies only if its own `requires` hold AND its speaker can still speak (no texts from the dead). */
function variantIndex(theme: FatedTheme, facts: LifeFacts): number {
  return THEMES[theme].variants.findIndex((v) => meets(v.requires, facts) && meets(SPEAKER_REQUIRES[v.who] ?? [], facts));
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

export function storyPopup(state: LifeState, kind: "fated" | "arc", ref: string, facts: LifeFacts, rng: SeededRandom): StoryPopupDef | undefined {
  if (kind === "fated") {
    const e = fatedEvent(state, ref);
    if (!e || e.done) return;
    if (e.theme === "ILLNESS" && !e.data?.patient) e.data = { ...e.data, patient: illnessPatient(state, facts, rng) };
    const vi = variantIndex(e.theme, facts);
    if (vi < 0) {
      e.done = true; // this turning point can't apply to this life right now
      return;
    }
    const v = THEMES[e.theme].variants[vi];
    return { ref: `fated:${e.id}#${vi}`, who: v.who, line: v.line, choices: v.choices.map((c) => c.t), location: v.location, activity: v.activity, needsFated: v.who === "fated" };
  }
  const arc = state.story!.arcs.find((a) => a.id === ref);
  if (!arc) return;
  const step = arc.steps[arc.step];
  const def = ARCS[arc.type].steps[step.key];
  return { ref: `arc:${arc.id}`, who: def.who, line: def.line, choices: def.choices.map((c) => c.t), location: def.location, activity: def.activity };
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface StoryResult {
  r: Bi;
  scene?: string[];
  outcome: string;
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
    const v = THEMES[e.theme].variants[Number(vis ?? variantIndex(e.theme, ctx.facts))];
    const choice = v.choices[Math.max(0, Math.min(v.choices.length - 1, choiceIndex))];
    const outcome = resolveOutcome(e.chartWeights, choice.weights, rng);
    e.done = true;
    e.outcome = outcome;
    const o = v.outcomes[outcome];
    applyEffects(o.effects, ctx, { event: e });
    ctx.facts = { ...ctx.facts, ...liveNames(state) };
    if (o.card) queueCard(state, o.card, ctx, e.data);
    flushFollowUpCards(state, ctx);
    // The chart (70%) overrode what the player asked for → say so, so the result never reads as a non sequitur.
    const r = (choice.weights[outcome] ?? 0) < 0.25 ? withBridge(o.r, rng) : o.r;
    return { r, scene: o.scene, outcome };
  }
  const arc = st.arcs.find((a) => a.id === ref.slice(4));
  if (!arc) return;
  const step = arc.steps[arc.step];
  const def = ARCS[arc.type].steps[step.key];
  const outcome = def.choices[Math.max(0, Math.min(def.choices.length - 1, choiceIndex))].outcome;
  const o = def.outcomes[outcome];
  arc.step += 1;
  applyEffects(o.effects, ctx, { arc, choiceLabel });
  ctx.facts = { ...ctx.facts, ...liveNames(state) };
  if (o.card) queueCard(state, o.card, ctx, arc.data);
  flushFollowUpCards(state, ctx);
  if (arc.step >= arc.steps.length) st.arcs = st.arcs.filter((a) => a !== arc);
  if (arc.type === "ILLNESS" && step.key === "RESULT") return { r: illnessResultText(arc), scene: arc.data?.passed ? ["funeral_hall"] : undefined, outcome };
  return { r: o.r, scene: o.scene, outcome };
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
  return arc.data?.passed
    ? { ko: `…${who}은(는) 끝내 이겨내지 못했다.`, en: `…${who} couldn't overcome it in the end.` }
    : { ko: `완치 판정을 받았다! ${who}와(과) 함께 울었다.`, en: `Declared cancer-free! You cried together with ${who}.` };
}

export function queueCard(state: LifeState, kind: string, ctx: StoryCtx, data?: Record<string, unknown>): void {
  const f = ctx.facts;
  const lastPet = (state.pets ?? []).at(-1);
  const lastKid = (state.kids ?? []).at(-1);
  const patient = data?.patient ? patientLabel(state, String(data.patient), f).ko : "";
  state.story!.cards.push({
    kind,
    age: Math.floor(state.age),
    vars: {
      partner: f.partnerName ?? (state.flags.lastPartnerName as string) ?? "",
      friend: f.friendName ?? "",
      kid: lastKid?.name ?? "",
      pet: (data?.petName as string) ?? lastPet?.name ?? "",
      patient,
      city: state.location.city,
    },
  });
}

function applyEffects(effects: StoryEffect[], ctx: StoryCtx, src: { event?: FatedEvent; arc?: ActiveArc; choiceLabel?: string }): void {
  const { state, rng } = ctx;
  const w = state.world;
  for (const eff of effects) {
    switch (eff.kind) {
      case "startDatingFated": {
        let npc = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
        if (w && !npc) {
          npc = generateNpc(w, rng, { type: "regular_customer", region: w.homeRegion, date: state.date, aroundAge: state.age, persistence: "PERSISTENT" });
          npc.fated = true;
        }
        if (!npc || !w) break;
        npc.single = false;
        w.relationships[npc.id] ??= { npcId: npc.id, stage: "ACQUAINTANCE", closeness: 0.3, spark: 0.5, conversations: 3, origin: { type: "RANDOM_ENCOUNTER", locationId: "cafe", firstEncounterDate: { ...state.date } }, lastContact: { ...state.date }, channel: "IN_PERSON", metOffline: true };
        w.relationships[npc.id].stage = "PARTNER";
        if (!state.npcs.some((n) => n.id === npc!.id)) {
          const birth = { year: npc.birthYear, month: npc.birthMonth, day: npc.birthDay, sex: npc.sex };
          state.npcs.push({ id: npc.id, name: npc.name, birth, chart: calculateNatalChart(birth), role: "PARTNER", metAt: { ...state.date } });
        }
        state.relationship = { status: "DATING", partnerId: npc.id, sinceMonth: state.monthIndex };
        state.flags.lastPartnerName = npc.name;
        startArc(state, "DATING", rng);
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
      case "arcStepAgain":
        // "Not yet": the next step (e.g. the last-chance talk) comes after a while.
        if (src.arc && src.arc.steps[src.arc.step]) {
          const [a, b] = eff.after as [number, number];
          src.arc.steps[src.arc.step].dueMonth = state.monthIndex + rng.int(a, b);
        }
        break;
      case "parentDies": {
        const who = (eff.who as "mom" | "dad" | undefined) ?? (src.arc?.data?.who as "mom" | "dad" | undefined) ?? "mom";
        if (state.family?.[who]) state.family[who].alive = false;
        if (src.arc?.type === "PARENT_PASSING") queueCard(state, who === "mom" ? "MOM_FUNERAL" : "DAD_FUNERAL", ctx);
        break;
      }
      case "adoptPet": {
        const species = eff.species as "DOG" | "CAT";
        const names = PET_NAMES[species];
        const pet = { id: `pet${(state.pets?.length ?? 0) + 1}`, name: names[rng.int(0, names.length - 1)], species, adoptedYear: state.date.year, ageAtAdoption: rng.int(0, 3), alive: true, spriteSeed: rng.int(0, 999999) };
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
        const partner = state.relationship.partnerId;
        const name = src.choiceLabel ?? "아가";
        (state.kids ??= []).push({ id: `kid${(state.kids?.length ?? 0) + 1}`, name, sex: rng.chance(0.5) ? "MALE" : "FEMALE", bornYear: state.date.year, bornMonth: state.date.month, spriteSeed: rng.int(0, 999999) });
        void partner;
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
          if (state.family?.[who]) state.family[who].alive = false;
          queueCard(state, who === "mom" ? "MOM_FUNERAL" : "DAD_FUNERAL", ctx);
        } else if (who === "partner") {
          const pid = state.relationship.partnerId;
          state.flags.lastPartnerName = String(arc.data.patientName ?? "");
          queueCard(state, "PARTNER_FUNERAL", ctx);
          state.relationship = { status: "SINGLE" };
          if (pid && w?.relationships[pid]) w.relationships[pid].stage = "DECEASED";
          if (pid && w?.npcs[pid]) w.npcs[pid].deceased = true;
          state.flags.widowed = true;
        } else if (who === "friend") {
          const best = w ? Object.values(w.relationships).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").sort((a, b) => b.closeness - a.closeness)[0] : undefined;
          if (best) {
            best.stage = "DECEASED";
            if (w?.npcs[best.npcId]) w.npcs[best.npcId].deceased = true;
          }
          queueCard(state, "FRIEND_FUNERAL", ctx);
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
  return fillNames(text, { ...extra, partner: facts.partnerName ?? "", friend: facts.friendName ?? "", pet, patient: extra.patient ?? "", kid: (state.kids ?? []).at(-1)?.name ?? "" });
}
