/**
 * Life events — the library of things that can happen in a life (romance, betrayal, marriage,
 * family secrets, money, dark turns, friendship, career, health, fate, daily chaos…).
 * 사주-driven, not scripted:
 *
 *  - requires  life facts that must hold, re-checked when it shows (never contradicts the life)
 *  - rarity    common … legendary: the base chance per year
 *  - trigger   what makes it likelier THIS year: 사주/점성술 year signals (도화, 역마, 편재, 삼재,
 *              Saturn hard on the Sun…), the month's hidden modifiers (risk, stability…), MBTI
 *              temperament and life facts
 *  - choices   the player's reaction; outcomes then lean with their temperament and the chart
 *              (an impulsive person who "tries just once" gets hooked more often)
 *  - chain     an outcome can set up follow-ups months later (도박 → 사채 → 이혼 위기 → 재기/파산)
 *  - react     revelations (someone comes out, a secret surfaces): each family member reacts in
 *              their own way — supportive, shocked, needs time — and some come around later
 *
 * Pacing: a new (non-chain) event roughly every 2–3 years; chains always go through. Events
 * wait in a queue and surface on the next played day that isn't grave (at most one per day);
 * anything left waiting too long resolves off-screen by temperament and leaves a memory card.
 */
import { freshness, markSeen } from "./deviceMemory";
import type { SeededRandom } from "../core/rng";
import type { LifeModifierKey, LifeModifiers } from "../core/lifeModifiers";
import type { LifeState } from "../sim/types";
import { type LifeFacts, meets } from "../game/facts";
import { SPEAKER_REQUIRES } from "../game/director";

type Bi = { ko: string; en: string };
export type StoryEffect = { kind: string; [k: string]: unknown };

export interface LifeEventOutcome {
  r: Bi;
  effects?: StoryEffect[];
  /** Memory card: a card kind from cards.json, or an inline card for the 시간이 흐른다 screen. */
  card?: string | { caption: Bi; location: string; actors?: string[]; priority?: number };
  /** Temperament / chart lean: this outcome is likelier for these traits (+) or less likely (−). */
  lean?: Lean;
  /** Follow-ups months later — whether they come, and which, depends on the person (see ChainDef). */
  chain?: ChainDef[];
}

/**
 * How strongly something leans with the person (log scale): temperament (MBTI/core traits, centered),
 * this month's hidden modifiers (the chart), life facts, this year's 사주/점성술 signals, and 궁합 with
 * the current partner (centered: +1 good match, −1 poor).
 */
export interface Lean {
  traits?: Record<string, number>;
  mods?: Partial<Record<LifeModifierKey, number>>;
  facts?: Record<string, number>;
  signals?: Record<string, number>;
  compat?: number;
}

/**
 * A follow-up. Not everyone's life goes the same way: `p` bends with `lean`, and `oneOf` lists
 * alternative next steps (caught early by family / quits alone / the loan shark), weighted by
 * `w` × lean — only those that fit this life (their `requires`) are ever picked.
 */
export interface ChainDef {
  to?: string;
  oneOf?: Array<{ to: string; w: number; lean?: Lean; urgent?: boolean }>;
  after: [number, number];
  p?: number;
  urgent?: boolean;
  vars?: Record<string, string>;
  lean?: Lean;
}

/** Everything about the person an outcome or a chain can lean on. */
export interface PersonCtx {
  traits: Record<string, number>;
  mods: LifeModifiers;
  facts?: LifeFacts;
  signals?: Record<string, number>;
  /** 궁합 with the current partner, 0..1 (undefined without a partner). */
  compat?: number;
}

/** Life moments an event can follow (a letter found after a parent's funeral, a feud over the will…). */
export type LifeHook = "parentDies" | "grandparentDies" | "siblingDies" | "partnerDies";

export interface LifeEventDef {
  id: string;
  cat: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  tone?: "light" | "romance" | "joy" | "dark" | "revelation";
  /** Life-changing: big popup with a title banner and the scene as its picture. */
  big?: boolean;
  title?: Bi;
  requires?: string[];
  /** Only happens as a follow-up of another event (or a hook). */
  chainOnly?: boolean;
  /** Happens (with probability p) some months after a life moment, e.g. a parent's death. */
  hooks?: Array<{ on: LifeHook; p: number; after?: [number, number]; who?: "mom" | "dad" }>;
  /** Can happen more than once per life (after `cooldown` months). */
  repeatable?: boolean;
  cooldown?: number;
  trigger?: {
    signals?: Record<string, number>;
    mods?: Partial<Record<LifeModifierKey, number>>;
    traits?: Record<string, number>;
    facts?: Record<string, number>;
  };
  location?: string;
  activity?: string;
  who: string;
  line: Bi;
  choices: Array<{ t: Bi; w: Record<string, number> }>;
  outcomes: Record<string, LifeEventOutcome>;
  /**
   * Other ways the same moment can be lived (a different opening line, different choices and their own
   * results): one is picked each time it happens (the base counts as one), favoring ones this device
   * hasn't seen lately — so a friend's death never asks the same two things twice.
   */
  choiceSets?: Array<{ line?: Bi; choices: Array<{ t: Bi; w: Record<string, number> }>; outcomes?: Record<string, LifeEventOutcome> }>;
  /**
   * The same moment at an unusual age (a friend's wedding at 70, a classroom at 45): the first form whose
   * [min, max] holds your age replaces the words; `choices` keep the base odds at the same position and
   * `outcomes` replace only result lines.
   */
  byAge?: Array<{ min?: number; max?: number; title?: Bi; line?: Bi; choices?: Array<{ t: Bi }>; outcomes?: Record<string, { r: Bi }> }>;
}

/** This occurrence's version of the event (see `choiceSets`), the same at the popup and when it resolves. */
export function eventView(state: LifeState, def: LifeEventDef, uid: string): LifeEventDef {
  const age = Math.floor(state.age);
  const aged = def.byAge?.find((f) => (f.min === undefined || age >= f.min) && (f.max === undefined || age <= f.max));
  if (aged) {
    const outcomes = { ...def.outcomes };
    for (const [k, o] of Object.entries(aged.outcomes ?? {})) if (outcomes[k]) outcomes[k] = { ...outcomes[k], r: o.r };
    const choices = aged.choices?.length === def.choices.length ? def.choices.map((c, i) => ({ ...c, t: aged.choices![i].t })) : def.choices;
    return { ...def, title: aged.title ?? def.title, line: aged.line ?? def.line, choices, outcomes };
  }
  const sets = def.choiceSets ?? [];
  if (!sets.length) return def;
  const memo = `cs_${uid}`;
  let i = state.flags[memo] as number | undefined;
  if (i === undefined) {
    const pool = [-1, ...sets.map((_, k) => k)].map((k) => ({ k, w: freshness(`ev:${def.id}:${k}`) }));
    let h = 2166136261;
    for (const c of `${state.flags.lifeSalt ?? 0}:${uid}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    let r = ((h % 10000) / 10000) * pool.reduce((a, o) => a + o.w, 0);
    i = (pool.find((o) => (r -= o.w) < 0) ?? pool[0]).k;
    state.flags[memo] = i;
    markSeen(`ev:${def.id}:${i}`);
  }
  const set = sets[i];
  return set ? { ...def, line: set.line ?? def.line, choices: set.choices, outcomes: { ...def.outcomes, ...(set.outcomes ?? {}) } } : def;
}

export interface PendingEvent {
  uid: string;
  id: string;
  due: number;
  chain?: boolean;
  urgent?: boolean;
  vars?: Record<string, string>;
}

export interface LifeEventState {
  pending: PendingEvent[];
  /** Event id → month indexes it happened (rolled or chained). */
  history: Record<string, number[]>;
  /** No new (non-chain) event before this month. */
  next: number;
  seq: number;
  /** Lines for the next 시간이 흐른다 screen from events resolved off-screen (with the names they need). */
  notes: Array<Bi & { vars?: Record<string, string> }>;
}

export const RARITY_PER_YEAR = { common: 0.08, uncommon: 0.035, rare: 0.012, legendary: 0.0025 } as const;
/** It's a romance game: love stories come up more often than their rarity alone would say. */
export const CATEGORY_WEIGHT: Record<string, number> = { romance: 2 };
/** Months between new (non-chain) events. */
export const EVENT_GAP: [number, number] = [9, 18];
/** Waiting longer than this, an event resolves off-screen. */
export const EVENT_PATIENCE = 30;

let LIBRARY: Map<string, LifeEventDef> = new Map();
export function registerLifeEvents(defs: LifeEventDef[]): void {
  LIBRARY = new Map(defs.map((d) => [d.id, d]));
}
export function lifeEvent(id: string): LifeEventDef | undefined {
  return LIBRARY.get(id);
}
export function allLifeEvents(): LifeEventDef[] {
  return [...LIBRARY.values()];
}

export function eventState(state: LifeState): LifeEventState {
  const st = state.story!;
  return (st.events ??= { pending: [], history: {}, next: state.monthIndex + 6, seq: 1, notes: [] });
}

/** Temperament: core traits + the MBTI persona dimensions (planning, emotionalExpression…), 0..1. */
export function temperament(state: LifeState): Record<string, number> {
  const { persona, ...core } = state.traits;
  return { ...(persona as unknown as Record<string, number> | undefined), ...(core as unknown as Record<string, number>) };
}

const centered = (x: number | undefined) => ((x ?? 0.5) - 0.5) * 2;

/** How much likelier this event is this month than its base rate (log scale, clamped). */
export function triggerScore(def: LifeEventDef, ctx: { signals: Record<string, number>; mods: LifeModifiers; traits: Record<string, number>; facts: LifeFacts }): number {
  const t = def.trigger;
  if (!t) return 0;
  let s = 0;
  for (const [k, w] of Object.entries(t.signals ?? {})) s += w * Math.min(2, ctx.signals[k] ?? 0);
  for (const [k, w] of Object.entries(t.mods ?? {})) s += (w ?? 0) * (ctx.mods[k as LifeModifierKey] ?? 0);
  for (const [k, w] of Object.entries(t.traits ?? {})) s += w * centered(ctx.traits[k]);
  for (const [k, w] of Object.entries(t.facts ?? {})) s += ctx.facts[k] ? w : 0;
  return Math.max(-2.5, Math.min(2, s));
}

/** Can this event be shown right now (facts hold and its speaker can still speak)? */
/** Places that only make sense on a working day (a firing on a Saturday reads wrong). */
const WEEKDAY_PLACES = new Set(["office", "branch_office", "court", "university"]);

/** Happens only on a working day (its place is closed at weekends). */
export function weekdayOnly(def: LifeEventDef): boolean {
  return !!def.location && WEEKDAY_PLACES.has(def.location);
}

export function eventApplies(def: LifeEventDef, facts: LifeFacts): boolean {
  if (facts.weekend && weekdayOnly(def)) return false;
  // Living apart: your partner can't be there in person (only moments written for distance can happen).
  if (facts.apart && def.who === "partner" && !(def.requires ?? []).some((r) => /^(fatedAbroad|fatedFar|apart)$/.test(r))) return false;
  return meets(def.requires, facts) && meets(SPEAKER_REQUIRES[def.who] ?? [], facts);
}

/** Is the person a pending event is about (vars whoKey / subjectKey) still part of this life? */
function keyAlive(state: LifeState, facts: LifeFacts, key: string | undefined): boolean {
  if (!key || key === "me") return true;
  if (key === "mom") return !!facts.momAlive;
  if (key === "dad") return !!facts.dadAlive;
  if (key === "partner") return !!facts.partnered;
  // The same partner as when it was queued (not whoever came after).
  if (key.startsWith("partner:")) return !!facts.partnered && state.relationship.partnerId === key.slice(8);
  if (key === "kid") return !!facts.hasKid;
  const sib = state.family?.siblings?.find((x) => x.id === key);
  return sib ? sib.alive : true;
}

/** eventApplies, plus: the people this pending event is about are still around. */
export function pendingApplies(state: LifeState, p: PendingEvent, def: LifeEventDef, facts: LifeFacts): boolean {
  return eventApplies(def, facts) && keyAlive(state, facts, p.vars?.whoKey) && keyAlive(state, facts, p.vars?.subjectKey);
}

/**
 * Monthly: maybe a new event happens (at most one; rate-limited). The chance of each is its
 * rarity × how strongly this year's chart, the month's modifiers, temperament and life point to it.
 */
export function rollLifeEvents(state: LifeState, rng: SeededRandom, ctx: { signals: Record<string, number>; mods: LifeModifiers; facts: LifeFacts }): PendingEvent | undefined {
  const es = eventState(state);
  const now = state.monthIndex;
  if (now < es.next || es.pending.filter((p) => !p.chain).length >= 2) return;
  const traits = temperament(state);
  const cands: Array<{ item: LifeEventDef; weight: number }> = [];
  for (const def of LIBRARY.values()) {
    if (def.chainOnly) continue;
    const seen = es.history[def.id];
    if (seen?.length && (!def.repeatable || now - seen[seen.length - 1] < (def.cooldown ?? 60))) continue;
    if (es.pending.some((p) => p.id === def.id)) continue;
    if (!eventApplies(def, ctx.facts)) continue;
    const p = (RARITY_PER_YEAR[def.rarity] / 12) * (CATEGORY_WEIGHT[def.cat] ?? 1) * Math.exp(triggerScore(def, { ...ctx, traits }));
    // Lives on this device lean toward events this player hasn't met yet.
    cands.push({ item: def, weight: p * freshness(`ev:${def.id}`) });
  }
  const total = cands.reduce((a, c) => a + c.weight, 0);
  if (!cands.length || !rng.chance(Math.min(0.9, total))) return;
  const def = rng.weighted(cands);
  const ev: PendingEvent = { uid: `ev${es.seq++}`, id: def.id, due: now };
  es.pending.push(ev);
  (es.history[def.id] ??= []).push(now);
  markSeen(`ev:${def.id}`);
  es.next = now + rng.int(EVENT_GAP[0], EVENT_GAP[1]);
  return ev;
}

/** Queue a follow-up (chains skip the rate limit). */
export function queueChain(state: LifeState, to: string, after: [number, number], rng: SeededRandom, opts: { urgent?: boolean; vars?: Record<string, string> } = {}): PendingEvent | undefined {
  if (!LIBRARY.has(to)) return;
  const es = eventState(state);
  const ev: PendingEvent = { uid: `ev${es.seq++}`, id: to, due: state.monthIndex + rng.int(after[0], after[1]), chain: true, urgent: opts.urgent, vars: opts.vars };
  es.pending.push(ev);
  (es.history[to] ??= []).push(ev.due);
  return ev;
}

/**
 * A life moment happened (a parent died…): events hooked to it may follow. At most one per moment,
 * so a funeral isn't followed by a pile of revelations.
 */
export function fireHooks(state: LifeState, on: LifeHook, rng: SeededRandom, opts: { who?: string; vars?: Record<string, string> } = {}): PendingEvent | undefined {
  const cands: Array<{ item: { def: LifeEventDef; after: [number, number] }; weight: number }> = [];
  const es = eventState(state);
  for (const def of LIBRARY.values()) {
    // A once-in-a-life event doesn't come back with the next funeral (유산 분쟁 after Mom, then again after Dad).
    const seen = es.history[def.id];
    if ((seen?.length && (!def.repeatable || state.monthIndex - seen[seen.length - 1] < (def.cooldown ?? 60))) || es.pending.some((p) => p.id === def.id)) continue;
    for (const h of def.hooks ?? []) {
      if (h.on !== on || (h.who && h.who !== opts.who)) continue;
      if (rng.chance(h.p)) cands.push({ item: { def, after: h.after ?? [1, 6] }, weight: h.p });
    }
  }
  if (!cands.length) return;
  const pick = rng.weighted(cands);
  return queueChain(state, pick.def.id, pick.after, rng, { vars: opts.vars });
}

/** The event to show on today's played day, if any (chains first, then big ones, then the longest waiting). */
export function nextDueEvent(state: LifeState, facts: LifeFacts): { pending: PendingEvent; def: LifeEventDef } | undefined {
  const es = state.story?.events;
  if (!es) return;
  // Follow-ups first, then life-changing events, then whatever has waited longest.
  const big = (p: PendingEvent) => Number(!!LIBRARY.get(p.id)?.big);
  const due = es.pending.filter((p) => p.due <= state.monthIndex).sort((a, b) => Number(!!b.chain) - Number(!!a.chain) || big(b) - big(a) || a.due - b.due);
  for (const p of due) {
    const def = LIBRARY.get(p.id);
    if (!def) {
      es.pending = es.pending.filter((x) => x !== p);
      continue;
    }
    if (pendingApplies(state, p, def, facts)) return { pending: p, def };
    // Only waiting for a weekday (the court is closed on Saturdays): keep it.
    if (facts.weekend && pendingApplies(state, p, def, { ...facts, weekend: false })) continue;
    // No longer fits this life (e.g. the partner it was about is gone): it quietly doesn't happen.
    if (state.monthIndex - p.due > 6) es.pending = es.pending.filter((x) => x !== p);
  }
  return;
}

/** Lean score (log scale, clamped) of a Lean for this person. */
export function leanScore(lean: Lean | undefined, person: PersonCtx): number {
  if (!lean) return 0;
  let s = 0;
  for (const [t, x] of Object.entries(lean.traits ?? {})) s += x * centered(person.traits[t]);
  for (const [m, x] of Object.entries(lean.mods ?? {})) s += (x ?? 0) * (person.mods[m as LifeModifierKey] ?? 0);
  for (const [f, x] of Object.entries(lean.facts ?? {})) s += person.facts?.[f] ? x : 0;
  for (const [k, x] of Object.entries(lean.signals ?? {})) s += x * Math.min(2, person.signals?.[k] ?? 0);
  if (lean.compat && person.compat !== undefined) s += lean.compat * (2 * person.compat - 1) * 1.5;
  return Math.max(-1.5, Math.min(1.5, s));
}

/**
 * The chart's say in every outcome, from what the outcome does: money won leans with this year's
 * 재물운 (the wealth modifier), money lost against it; a split leans against a good 궁합; a new
 * love with the romance modifier; work changes with career; family and friends with theirs.
 * Authored leans add to this.
 */
const AUTO = new WeakMap<LifeEventOutcome, Lean>();
export function autoLean(o: LifeEventOutcome): Lean {
  const hit = AUTO.get(o);
  if (hit) return hit;
  const mods: Partial<Record<LifeModifierKey, number>> = {};
  let compat = 0;
  const add = (k: LifeModifierKey, x: number) => (mods[k] = (mods[k] ?? 0) + x);
  for (const e of o.effects ?? []) {
    const amt = Number(e.amount ?? 0);
    switch (e.kind) {
      case "money":
        if (amt > 0) (add("wealth", 0.4), add("opportunity", 0.15));
        else if (amt < 0) add("wealth", -0.3);
        break;
      case "debt":
      case "loseMoneyTo":
        (add("wealth", -0.4), add("volatility", 0.2));
        break;
      case "separate":
      case "breakUp":
        (add("romance", -0.3), add("stability", -0.3), (compat -= 0.6));
        break;
      case "startDatingNew":
      case "startDatingEx":
      case "startDatingFriend":
      case "startDatingFated":
      case "engage":
      case "marry":
        add("romance", 0.4);
        break;
      case "job":
        add("career", 0.3);
        break;
      case "quitJob":
        add("career", -0.4);
        break;
      case "careerLevel":
        add("career", Number(e.delta ?? 0) > 0 ? 0.5 : -0.5);
        break;
      case "familySupport":
        add("family", Number(e.delta ?? 0) > 0 ? 0.3 : -0.3);
        break;
      case "newFriend":
        add("social", 0.3);
        break;
      case "loseFriend":
        add("social", -0.3);
        break;
      case "clearFlag":
        if (["gambling", "alcohol", "cult", "hikikomori", "depressed", "distance"].includes(String(e.name))) (add("stability", 0.3), (compat += String(e.name) === "distance" ? 0.4 : 0));
        break;
      case "setFlag":
        if (["gambling", "alcohol", "cult", "hikikomori", "depressed"].includes(String(e.name))) add("stability", -0.4);
        if (String(e.name) === "distance") (add("stability", -0.2), (compat -= 0.4));
        break;
    }
  }
  const lean: Lean = { mods, compat: compat || undefined };
  AUTO.set(o, lean);
  return lean;
}

/** Outcome weights for a choice, leaning with this person: temperament, the chart, life facts, 궁합. */
export function outcomeWeights(def: LifeEventDef, choiceIndex: number, person: PersonCtx): Record<string, number> {
  const ch = def.choices[Math.max(0, Math.min(def.choices.length - 1, choiceIndex))];
  const out: Record<string, number> = {};
  for (const [k, w] of Object.entries(ch.w)) {
    const o = def.outcomes[k];
    const s = o ? leanScore(o.lean, person) + leanScore(autoLean(o), person) : 0;
    out[k] = w * Math.exp(Math.max(-1.5, Math.min(1.5, s)));
  }
  return out;
}

/** Pick the choice this person would most likely make (used when an event resolves off-screen). */
export function instinctiveChoice(def: LifeEventDef, person: PersonCtx, rng: SeededRandom): number {
  const scores = def.choices.map((_, i) => {
    const w = outcomeWeights(def, i, person);
    const t = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    return { item: i, weight: 0.2 + t };
  });
  return rng.weighted(scores);
}

/**
 * Which follow-up (if any) this person gets: p bends with the chain's lean; among `oneOf`
 * alternatives, only those that fit this life can be picked, weighted by w × lean.
 */
export function pickChain(state: LifeState, c: ChainDef, person: PersonCtx, rng: SeededRandom): { to: string; urgent?: boolean } | undefined {
  const p = Math.min(0.98, (c.p ?? 1) * Math.exp(leanScore(c.lean, person)));
  if (!rng.chance(p)) return;
  if (!c.oneOf?.length) return c.to ? { to: c.to, urgent: c.urgent } : undefined;
  const facts = person.facts ? { ...person.facts, weekend: false } : undefined;
  const opts = c.oneOf
    .filter((o) => {
      const def = LIBRARY.get(o.to);
      return !!def && (!facts || meets(def.requires, facts));
    })
    .map((o) => ({ item: o, weight: o.w * Math.exp(leanScore(o.lean, person)) }));
  if (!opts.length) return;
  const pick = rng.weighted(opts);
  return { to: pick.to, urgent: pick.urgent ?? c.urgent };
}

export interface FamilyMember {
  key: string;
  label: Bi;
  /** 0..1, hidden: how open-minded they are (stable per person). */
  openness: number;
}

/**
 * How each family member reacts to a revelation (someone coming out, a secret surfacing).
 * Never framed as a misfortune: the tension is in the reactions — and people can come around.
 */
export function familyReactions(members: FamilyMember[], playerSupported: boolean, rng: SeededRandom): Array<{ member: FamilyMember; reaction: "supportive" | "needsTime" | "shocked" }> {
  return members.map((m) => {
    const o = m.openness + (playerSupported ? 0.15 : -0.1) + rng.range(-0.15, 0.15);
    return { member: m, reaction: o > 0.6 ? "supportive" : o > 0.32 ? "needsTime" : "shocked" };
  });
}
