/**
 * Life-event runtime: resolve a choice (outcome leans with temperament and the chart), apply its
 * effects, leave a memory card, queue follow-ups, and — for revelations — let each family member
 * react in their own way. Events left waiting too long resolve off-screen by instinct.
 */
import type { SeededRandom } from "../core/rng";
import type { LifeModifiers } from "../core/lifeModifiers";
import type { LifeState } from "../sim/types";
import { aliveSiblings, siblingLabel } from "./family";
import { EVENT_PATIENCE, type FamilyMember, pendingApplies, type LifeEventOutcome, type StoryEffect, eventState, familyReactions, instinctiveChoice, lifeEvent, outcomeWeights, queueChain, temperament } from "./lifeEvents";
import { type StoryCtx, applyStoryEffects, queueCard } from "./storyEngine";

type Bi = { ko: string; en: string };

export interface EventResolution {
  r: Bi;
  outcome: string;
  /** The names this event was about (who / subject…), for filling its text later. */
  vars: Record<string, string>;
  /** Extra lines (family reactions…) to show after the result. */
  extra: Bi[];
}

const hash01 = (x: string) => {
  let h = 2166136261;
  for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

/** Family members who would react (hidden openness is stable per person) — the partner too. */
function familyFor(state: LifeState, exclude: string, facts: StoryCtx["facts"]): FamilyMember[] {
  const out: FamilyMember[] = [];
  const key = `${state.name}|${state.birth.year}`;
  if (state.family?.mom.alive && exclude !== "mom") out.push({ key: "mom", label: { ko: "엄마", en: "Mom" }, openness: hash01(`mom|${key}`) });
  if (state.family?.dad.alive && exclude !== "dad") out.push({ key: "dad", label: { ko: "아빠", en: "Dad" }, openness: hash01(`dad|${key}`) });
  const sibs = aliveSiblings(state);
  for (const [i, sib] of sibs.entries()) {
    if (exclude === "sibling" && i === 0) continue;
    out.push({ key: sib.id, label: { ko: siblingLabel(state, sib).ko, en: sib.name }, openness: hash01(`${sib.id}|${key}`) });
  }
  const pid = state.relationship.partnerId;
  if (facts.partnered && facts.partnerName && exclude !== "partner" && pid) out.push({ key: `partner:${pid}`, label: { ko: facts.partnerName, en: facts.partnerName }, openness: hash01(`${pid}|${key}`) });
  // Keep the moment readable: the parents, then up to two more.
  return out.slice(0, 4);
}

/** Who a revelation is about, for the lines that follow (ko name / en possessive). */
function subjectOf(state: LifeState, subject: string, facts: StoryCtx["facts"]): { ko: string; en: string; key: string } {
  const sib = aliveSiblings(state)[0];
  if (subject === "sibling" && sib) {
    const l = siblingLabel(state, sib);
    return { ko: l.ko, en: `${sib.name}'s`, key: sib.id };
  }
  if (subject === "partner") return { ko: facts.partnerName ?? "", en: `${facts.partnerName ?? ""}'s`, key: `partner:${state.relationship.partnerId ?? ""}` };
  if (subject === "kid") return { ko: facts.kidName ?? "", en: `${facts.kidName ?? ""}'s`, key: "kid" };
  if (subject === "mom") return { ko: "엄마", en: "Mom's", key: "mom" };
  if (subject === "dad") return { ko: "아빠", en: "Dad's", key: "dad" };
  return { ko: "네", en: "your", key: "me" };
}

const REACT_LINES: Record<"supportive" | "needsTime" | "shocked", (who: Bi) => Bi> = {
  supportive: (w) => ({ ko: `${w.ko}: "말해줘서 고마워. 달라지는 건 없어."`, en: `${w.en}: "Thank you for telling us. Nothing changes."` }),
  needsTime: (w) => ({ ko: `${w.ko}은(는) 한동안 말이 없었다. 시간이 필요해 보였다.`, en: `${w.en} went quiet for a long while. They seemed to need time.` }),
  shocked: (w) => ({ ko: `${w.ko}은(는) 크게 놀라 자리를 떴다.`, en: `${w.en} was shaken and left the room.` }),
};

function familyReact(state: LifeState, eff: StoryEffect, rng: SeededRandom, supported: boolean, facts: StoryCtx["facts"]): Bi[] {
  const subject = String(eff.subject ?? "sibling");
  const subj = subjectOf(state, subject, facts);
  // Someone who already reacted in the story itself (the parent you told first) isn't rolled again.
  const exclude = new Set((eff.exclude as string[] | undefined) ?? []);
  const reactions = familyReactions(familyFor(state, subject, facts).filter((m) => !exclude.has(m.key)), supported, rng);
  const lines: Bi[] = [];
  for (const { member, reaction } of reactions) {
    lines.push(REACT_LINES[reaction](member.label));
    // Those who needed time — or were shocked — may come around later.
    if (reaction !== "supportive" && rng.chance(reaction === "needsTime" ? 0.75 : 0.45)) {
      queueChain(state, "COMING_AROUND", [6, 30], rng, {
        vars: { who_ko: member.label.ko, who_en: member.label.en, whoKey: member.key, subject_ko: subj.ko, subject_en: subj.en, subjectKey: subj.key },
      });
    }
  }
  return lines;
}

/** Resolve one life event with the chosen reaction. */
export function resolveLifeEvent(uid: string, choiceIndex: number, ctx: StoryCtx): EventResolution | undefined {
  const { state, rng, mods } = ctx;
  const es = eventState(state);
  const p = es.pending.find((x) => x.uid === uid);
  if (!p) return;
  const def = lifeEvent(p.id);
  es.pending = es.pending.filter((x) => x !== p);
  if (!def) return;
  const weights = outcomeWeights(def, choiceIndex, temperament(state), mods);
  const outcome = rng.weighted(Object.entries(weights).map(([item, weight]) => ({ item, weight })));
  const o: LifeEventOutcome = def.outcomes[outcome];
  const effects = o.effects ?? [];
  applyStoryEffects(effects.filter((e) => e.kind !== "familyReact"), ctx);
  const extra: Bi[] = [];
  for (const e of effects.filter((x) => x.kind === "familyReact")) extra.push(...familyReact(state, e, rng, !!e.supported, ctx.facts));
  const vars = { ...(p.vars ?? {}) };
  if (typeof o.card === "string") queueCard(state, o.card, ctx, { vars });
  else if (o.card) {
    queueCard(state, "EVENT", ctx, {
      vars: { ...vars, cap_ko: o.card.caption.ko, cap_en: o.card.caption.en, loc: o.card.location, actors: (o.card.actors ?? ["me"]).join(","), priority: String(o.card.priority ?? 6) },
    });
  }
  for (const c of o.chain ?? []) if (rng.chance(c.p ?? 1)) queueChain(state, c.to, c.after, rng, { urgent: c.urgent, vars: { ...vars, ...(c.vars ?? {}) } });
  return { r: o.r, outcome, extra, vars };
}

/** Events that waited too long happen off-screen: the instinctive reaction, a card, a line on the skip screen. */
export function resolveStaleEvents(ctx: StoryCtx): void {
  const { state, rng } = ctx;
  const es = state.story?.events;
  if (!es) return;
  for (const p of es.pending.filter((x) => state.monthIndex - x.due > EVENT_PATIENCE)) {
    const def = lifeEvent(p.id);
    // Gone, or no longer fits this life (the partner it was about has left): it quietly doesn't happen.
    if (!def || !pendingApplies(state, p, def, { ...ctx.facts, weekend: false })) {
      es.pending = es.pending.filter((x) => x !== p);
      continue;
    }
    const res = resolveLifeEvent(p.uid, instinctiveChoice(def, temperament(state), ctx.mods as LifeModifiers, rng), ctx);
    // "커밍아웃 — …": the title gives the line its context on the skip screen.
    const t = def.title;
    if (res) es.notes.push({ ko: t ? `${t.ko} — ${res.r.ko}` : res.r.ko, en: t ? `${t.en} — ${res.r.en}` : res.r.en, vars: res.vars });
  }
}
