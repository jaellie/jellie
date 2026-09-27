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
  lean?: { traits?: Record<string, number>; mods?: Partial<Record<LifeModifierKey, number>> };
  /** Follow-ups: another event `after` [min,max] months, with probability p (extra `vars` go along). */
  chain?: Array<{ to: string; after: [number, number]; p?: number; urgent?: boolean; vars?: Record<string, string> }>;
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
export const EVENT_GAP: [number, number] = [20, 36];
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
    cands.push({ item: def, weight: p });
  }
  const total = cands.reduce((a, c) => a + c.weight, 0);
  if (!cands.length || !rng.chance(Math.min(0.9, total))) return;
  const def = rng.weighted(cands);
  const ev: PendingEvent = { uid: `ev${es.seq++}`, id: def.id, due: now };
  es.pending.push(ev);
  (es.history[def.id] ??= []).push(now);
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
  for (const def of LIBRARY.values()) {
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

/** Outcome weights for a choice, leaning with temperament and the chart. */
export function outcomeWeights(def: LifeEventDef, choiceIndex: number, traits: Record<string, number>, mods: LifeModifiers): Record<string, number> {
  const ch = def.choices[Math.max(0, Math.min(def.choices.length - 1, choiceIndex))];
  const out: Record<string, number> = {};
  for (const [k, w] of Object.entries(ch.w)) {
    const lean = def.outcomes[k]?.lean;
    let s = 0;
    for (const [t, x] of Object.entries(lean?.traits ?? {})) s += x * centered(traits[t]);
    for (const [m, x] of Object.entries(lean?.mods ?? {})) s += (x ?? 0) * (mods[m as LifeModifierKey] ?? 0);
    out[k] = w * Math.exp(Math.max(-1.5, Math.min(1.5, s)));
  }
  return out;
}

/** Pick the choice this person would most likely make (used when an event resolves off-screen). */
export function instinctiveChoice(def: LifeEventDef, traits: Record<string, number>, mods: LifeModifiers, rng: SeededRandom): number {
  const scores = def.choices.map((_, i) => {
    const w = outcomeWeights(def, i, traits, mods);
    const t = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    return { item: i, weight: 0.2 + t };
  });
  return rng.weighted(scores);
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
