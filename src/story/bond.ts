/**
 * The bond with the destined person frames the whole game: play starts when the two of you meet
 * (or right away, if you're already dating / in 썸) and ends the day it's over — a breakup, a
 * divorce, their death, a meeting that never comes. Married to the end, the ending is your own death.
 *
 *   waiting → the years before you meet pass off-screen; the next played day is the meeting.
 *   active  → 썸 or together: the normal story.
 *   over    → the game ends at the end of that day (see Game.endDay / Game.ending).
 */
import type { LifeState } from "../sim/types";

export type BondEnd = "missed" | "breakup" | "divorce" | "theyDied" | "iDied";

export interface Bond {
  /** You were a couple at some point. */
  together?: boolean;
  /** …and married. */
  married?: boolean;
  since?: { year: number; month: number; age: number };
  over?: { reason: BondEnd; year: number; month: number; age: number };
}

function fatedNpc(state: LifeState) {
  return Object.values(state.world?.npcs ?? {}).find((n) => n.fated);
}

/** Is this life framed by a destined person at all (setup named one)? */
export function hasBond(state: LifeState): boolean {
  return !!state.story && !!fatedNpc(state);
}

function withFated(state: LifeState): boolean {
  const f = fatedNpc(state);
  const rel = state.relationship;
  return !!f && rel.partnerId === f.id && (rel.status === "DATING" || rel.status === "MARRIED");
}

export function bondPhase(state: LifeState): "none" | "waiting" | "active" | "over" {
  if (!hasBond(state)) return "none";
  const b = state.story!.bond;
  if (b?.over) return "over";
  if (withFated(state) || state.story!.arcs.some((a) => a.type === "TALKING")) return "active";
  return "waiting";
}

/** The destined meetings still ahead (first meeting, or a second chance). */
export function pendingMeetings(state: LifeState) {
  return (state.story?.script ?? []).filter((e) => e.theme === "LOVE_MEETING" && !e.done);
}

/** Bring the bond up to date with the life; returns how it ended, the moment it ends. */
export function updateBond(state: LifeState): Bond["over"] | undefined {
  if (!hasBond(state)) return;
  const st = state.story!;
  const b = (st.bond ??= {});
  if (b.over) return;
  const now = { year: state.date.year, month: state.date.month, age: Math.floor(state.age) };
  const f = fatedNpc(state)!;
  if (withFated(state)) {
    if (!b.together) (b.together = true), (b.since = now);
    if (state.relationship.status === "MARRIED") b.married = true;
    if (!state.alive) b.over = { reason: "iDied", ...now };
    return b.over;
  }
  let reason: BondEnd | undefined;
  if (!state.alive) reason = "iDied";
  else if (b.together) reason = f.deceased ? "theyDied" : b.married ? "divorce" : "breakup";
  else if (st.arcs.some((a) => a.type === "TALKING")) reason = undefined;
  else if (f.deceased || !pendingMeetings(state).length) reason = "missed";
  if (reason) b.over = { reason, ...now };
  return b.over;
}
