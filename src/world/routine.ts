/**
 * A month of lived life in the world: habits (gym, classes, apps), work or
 * school, free-time outings, dates, and any trips the player decided on.
 * Choices inside visits go through a WorldDecisionPolicy (the player in UI).
 */
import type { GameDate } from "../core/gameDate";
import type { LifeModifiers } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import type { LifeState } from "../sim/types";
import { isAbroad } from "../sim/types";
import { ENCOUNTER_RULES, LOCATIONS, getLocation } from "./catalog";
import { weekdayOf } from "./clock";
import { type WorldDecisionPolicy, type WorldResolution, resolveWorldEvent } from "./decisions";
import { decayRelationships, type Attraction } from "./encounters";
import type { WorldEvent } from "./events";
import { habitSlot } from "./npcs";
import { runTrip, type TripResult } from "./travel";
import type { ScheduleBlock, WorldState } from "./types";
import { type VisitResult, WorldEngine } from "./worldEngine";

export interface RoutineContext {
  state: LifeState;
  world: WorldState;
  modifiers: LifeModifiers;
  rng: SeededRandom;
  seed: number;
  policy: WorldDecisionPolicy;
  attraction?: Attraction;
  /** Cap on habit visits per month (keeps long simulations fast). */
  maxHabitVisits?: number;
}

export interface MonthOutcome {
  visits: VisitResult[];
  decisions: Array<{ event: WorldEvent; resolution: WorldResolution }>;
  trips: TripResult[];
}

function dayMatching(rng: SeededRandom, date: GameDate, slot: ScheduleBlock): number {
  const options: number[] = [];
  for (let d = 1; d <= 28; d++) if (!slot.days || slot.days.includes(weekdayOf(date.year, date.month, d))) options.push(d);
  return options.length ? options[rng.int(0, options.length - 1)] : rng.int(1, 28);
}

const FREE_TIME = LOCATIONS.filter((l) => l.region === "home_city" && !["HOME", "WORKPLACE", "UNIVERSITY", "HOSPITAL", "WEDDING_VENUE", "FAMILY_HOME", "AIRPORT"].includes(l.type) && !l.online);

export function runMonth(ctx: RoutineContext, date: GameDate, engine = new WorldEngine()): MonthOutcome {
  const { state, world, rng } = ctx;
  const out: MonthOutcome = { visits: [], decisions: [], trips: [] };
  const partnered = state.relationship.status === "DATING" || state.relationship.status === "MARRIED";
  const base = { state, world, modifiers: ctx.modifiers, rng, seed: ctx.seed, attraction: ctx.attraction };

  const go = (locationId: string, day: number, hour: number, activityId?: string, withPartner = false) => {
    const r = engine.visit({ ...base, withPartner }, { locationId, activityId, date: { year: date.year, month: date.month, day }, hour });
    out.visits.push(r);
    for (const e of r.events) {
      if (!e.choices?.length) continue;
      const choice = ctx.policy.choose(e, state, world, rng);
      out.decisions.push({ event: e, resolution: resolveWorldEvent(e, choice, { state, world, modifiers: ctx.modifiers, rng }) });
    }
  };

  // 1) Habits (memberships, classes, apps) — they can lapse, like real routines.
  for (const [locId] of Object.entries(world.habits)) {
    const friendsThere = Object.values(world.relationships).some((r) => r.origin.locationId === locId && ["FRIEND", "CLOSE_FRIEND"].includes(r.stage));
    if (rng.chance(ENCOUNTER_RULES.habitLapsePerMonth * (friendsThere ? 0.4 : 1))) {
      delete world.habits[locId];
      state.memories.push({ date: { ...date }, age: Math.floor(state.age), text: `Stopped going to ${getLocation(locId).name.en}.`, tags: ["routine"] });
    }
  }
  let budget = ctx.maxHabitVisits ?? 4;
  for (const [locId, habit] of Object.entries(world.habits)) {
    const loc = getLocation(locId);
    if (loc.region !== world.homeRegion && loc.region !== "online") continue;
    const slot = habitSlot(loc, rng);
    const n = Math.min(budget, Math.max(1, Math.round(habit.perMonth * rng.range(0.4, 0.8))));
    budget -= n;
    for (let i = 0; i < n; i++) go(locId, dayMatching(rng, date, slot), slot.startHour, habit.activityId);
    if (budget <= 0) break;
  }

  // 2) Work / school
  if (state.enrollment && !isAbroad(state)) go("university", dayMatching(rng, date, { locationId: "university", startHour: 10, endHour: 17, days: [1, 2, 3, 4, 5] }), rng.int(10, 15), rng.chance(0.5) ? "attend_lecture" : "club_activity");
  if (state.career.employed && !isAbroad(state)) go("office", dayMatching(rng, date, { locationId: "office", startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5] }), rng.int(10, 16), rng.chance(0.7) ? "work" : "lunch_with_coworkers");

  // 3) Free time (novelty → new places; sociability → social activities; partner → dates)
  const outings = rng.int(1, 2);
  for (let i = 0; i < outings && !isAbroad(state); i++) {
    const loc = rng.weighted(
      FREE_TIME.map((l) => {
        const visited = world.locationMemory[l.id]?.visitCount ?? 0;
        const novelty = visited === 0 ? 0.5 + state.traits.novelty : 1 + Math.min(1, visited / 10) * (1 - state.traits.novelty);
        return { item: l, weight: novelty * (l.tags.includes("social") ? 0.6 + state.traits.sociability : 1) };
      }),
    );
    const withPartner = partnered && rng.chance(0.5);
    const acts = loc.activities.filter((a) => (withPartner ? true : a !== "date"));
    const activity = withPartner && loc.activities.includes("date") ? "date" : rng.weighted(acts.map((a) => ({ item: a, weight: a === "buy_membership" || a === "learn_recipe" ? state.traits.novelty * 0.4 : 1 })));
    go(loc.id, rng.int(1, 28), rng.int(10, 20), activity, withPartner);
  }

  // 4) Family
  if (rng.chance(0.15 + state.familyObligation * 0.4)) go("family_home", rng.int(1, 28), 18, "eat");

  // 5) Trips decided earlier
  for (const dest of world.pendingTrips ?? []) {
    out.trips.push(runTrip(base, dest, { year: date.year, month: date.month, day: rng.int(1, 18) }, ctx.policy, engine));
  }
  world.pendingTrips = [];

  // Keep the player's partner in sync with the sim's relationship state.
  for (const rel of Object.values(world.relationships)) {
    if (rel.stage === "PARTNER" && state.relationship.partnerId !== rel.npcId) rel.stage = "EX";
  }
  decayRelationships(world, date);
  return out;
}
