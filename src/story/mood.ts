/**
 * The mood line at the top of the play screen. It is never a fact and never the time: it is how you
 * feel, and it quietly foreshadows what the chart has in store —
 *   "(요즘 자꾸 해외로 나가고 싶다.)" a year before the move, "(남편이 요즘 휴대폰을 엎어 둔다.)" before
 *   the affair comes out, "(요즘 이상하게 사람들이 나를 자꾸 쳐다본다.)" in a 도화 year.
 * Picked once per played day from (most weight first) your own coming turning points, arc steps,
 * pending life events, your situation, then this year's 사주/점성술 signals; MBTI colours the wording.
 */
import data from "../../data/story/moods.json";
import type { SeededRandom } from "../core/rng";
import type { LifeState } from "../sim/types";
import { type LifeFacts, meets } from "../game/facts";
import { lifeEvent } from "./lifeEvents";
import { guardRequirements } from "../game/director";

type Line = { ko: string; en: string; mbti?: string; when?: string[] };
type Bank = {
  fated: Record<string, Line[]>;
  arcs: Record<string, Line[]>;
  events: Record<string, Line[]>;
  state: Array<{ when: string[]; lines: Line[] }>;
  signals: Record<string, Line[]>;
  quiet: Line[];
};
const BANK = data as unknown as Bank;

/** Months ahead a coming turning point / arc step / life event starts to colour your mood. */
const AHEAD = { fated: 14, arc: 8, event: 6 };

export interface Mood {
  ko: string;
  en: string;
  /** Where it came from (for QA / the destiny log): "fated:MOVE", "signal:DOHWA", … */
  source: string;
}

/** Every mood line (for tests). */
export function allMoodLines(): Line[] {
  return [
    ...Object.values(BANK.fated).flat(),
    ...Object.values(BANK.arcs).flat(),
    ...Object.values(BANK.events).flat(),
    ...BANK.state.flatMap((s) => s.lines),
    ...Object.values(BANK.signals).flat(),
    ...BANK.quiet,
  ];
}

export function pickMood(state: LifeState, facts: LifeFacts, signals: Record<string, number>, rng: SeededRandom, recent: string[] = []): Mood {
  const mbti = String(state.flags.mbti ?? "").toUpperCase();
  // The same keyword guard as popups: no "엄마" line once Mom has passed, no 팀장 after retiring…
  const guarded = (l: Line) => guardRequirements([l.ko, l.en]).every((g) => meets(g.requires, facts));
  const fits = (l: Line) => (!l.mbti || mbti.includes(l.mbti)) && (!l.when || meets(l.when, facts)) && !recent.includes(l.ko) && guarded(l);
  const cands: Array<{ item: Mood; weight: number }> = [];
  const add = (lines: Line[] | undefined, source: string, weight: number) => {
    for (const l of lines ?? []) if (fits(l)) cands.push({ item: { ko: l.ko, en: l.en, source }, weight });
  };
  const now = state.monthIndex;
  const st = state.story;
  // 1. Your own turning points, a year or so ahead.
  for (const e of st?.script ?? []) {
    if (e.done || e.monthIndex < now || e.monthIndex - now > AHEAD.fated) continue;
    if (e.theme === "RELATIONSHIP_CRISIS" && !facts.partnered) continue;
    if (e.theme === "LOVE_MEETING" && facts.partnered) continue;
    add(BANK.fated[e.theme], `fated:${e.theme}`, 6);
  }
  // 2. The next step of what you're living through (the affair about to come out, the proposal…).
  for (const a of st?.arcs ?? []) {
    const step = a.steps[a.step];
    if (!step || step.dueMonth - now > AHEAD.arc) continue;
    if (a.type === "AFFAIR" && step.key !== "DISCOVER") continue;
    // Long distance is only a mood while you actually live apart.
    if (a.type === "LONG_DISTANCE" && !state.relationship.longDistance) continue;
    if (a.type === "DATING" && step.key === "FIRST_DATE") continue;
    if (a.type === "PARENT_PASSING" && a.data?.who && state.family?.[a.data.who as "mom" | "dad"]?.alive === false) continue;
    add(BANK.arcs[a.type], `arc:${a.type}`, 5);
  }
  // 3. Life events waiting in the wings.
  for (const p of st?.events?.pending ?? []) {
    if (p.due - now > AHEAD.event) continue;
    const def = lifeEvent(p.id);
    if (!def || (def.cat === "partner" && !facts.partnered)) continue;
    add(BANK.events[def.cat], `event:${def.cat}`, 3);
  }
  // 4. Where your life is.
  for (const s of BANK.state) if (meets(s.when, facts)) add(s.lines, `state:${s.when.join("&")}`, 2);
  // 5. This year's chart.
  for (const [k, v] of Object.entries(signals)) if (v > 0 && BANK.signals[k]) add(BANK.signals[k], `signal:${k}`, 1.5);
  if (!cands.length) add(BANK.quiet, "quiet", 1);
  if (!cands.length) return { ...BANK.quiet[0], source: "quiet" };
  return rng.weighted(cands);
}
